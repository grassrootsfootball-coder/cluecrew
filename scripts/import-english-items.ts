/**
 * English calibration-tranche import (David's instruction, 2026-08-02).
 *
 * The items were drafted by Cowork and never imported, which is why the first
 * reviewer pack found an empty table. This lands all three batches as DRAFT.
 *
 * Two prerequisites the batches cannot supply themselves, both created here:
 *   · the ENGLISH question types. The district had NONE registered, so an
 *     item had no foreign key to point at and could not exist at all.
 *   · the 10 misconceptions authoring raised while drafting. An option
 *     referencing a missing id violates the foreign key, so the whole batch
 *     would fail on the first insert. They land PROPOSED, like every other
 *     corpus proposal — the reviewer's door is unchanged.
 *
 * Field mapping is explicit rather than spread, because the batches were
 * written against a reconstructed contract (their own standing flag says so)
 * and the canonical shapes are ours to enforce: `passageRef` and `lineRefs`
 * move INTO the stem, which is where the MC model carries them.
 *
 * Every item is screened by the shared child-facing gates on the way in. A
 * failure does not stop the import — these are DRAFT and a reviewer needs to
 * see them — but every one is reported.
 *
 * Run: pnpm import:english-items <dir-of-batch-files>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, roleForItemStem, type ContentFailure } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

/**
 * The seven types this tranche uses. `mechanic` names the interaction
 * honestly; NO engine binds to error-spot or cloze yet, which is recorded in
 * the report rather than papered over by calling everything select-one.
 */
const QUESTION_TYPES: Array<{ id: string; name: string; mechanic: string }> = [
  { id: 'en-comp-retrieval', name: 'Retrieval', mechanic: 'select-one' },
  { id: 'en-comp-inference', name: 'Inference', mechanic: 'select-one' },
  { id: 'en-comp-vocab', name: 'Vocabulary in Context', mechanic: 'select-one' },
  { id: 'en-comp-technique', name: 'Writer’s Technique', mechanic: 'select-one' },
  { id: 'en-spag-spelling-spot', name: 'Spelling: spot the slip', mechanic: 'error-spot' },
  { id: 'en-spag-punct-spot', name: 'Punctuation: spot the slip', mechanic: 'error-spot' },
  { id: 'en-spag-cloze', name: 'Grammar cloze', mechanic: 'cloze' },
];

interface BatchOption {
  label?: string;
  content: string;
  isCorrect: boolean;
  misconceptionId?: string;
}
interface BatchItem {
  itemId: string;
  questionTypeId: string;
  difficultyTier: number;
  stem: { text?: string; prompt?: string; [key: string]: unknown };
  options: BatchOption[];
  explanation?: Record<string, unknown>;
  authoredBy?: string;
  passageRef?: string;
  lineRefs?: number[];
  preReview?: Record<string, unknown>;
  /** Spans quoted from the passage, declared so the ban list can step over them. */
  quotes?: Array<{ text: string; passageRef?: string; lineRefs?: number[] }>;
  /** Words this item exists to test — exempt from the vocabulary ceiling. */
  testedTokens?: string[];
}
interface Batch {
  batchId: string;
  pool?: string;
  items: BatchItem[];
  proposedMisconceptions?: Array<{
    id: string;
    district: string;
    description: string;
    childHint: string;
    proposedBy?: string;
  }>;
  lowestConfidence?: Array<{ itemId: string; why?: string; note?: string }>;
}

async function main(): Promise<void> {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: … <dir-of-batch-files>');
    process.exit(1);
  }
  const files = readdirSync(dir)
    .filter((name) => /^ENG-\d+.*\.json$/.test(name))
    .sort();
  const batches = files.map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as Batch);
  console.log(`Batches: ${batches.map((batch) => `${batch.batchId} (${batch.items.length})`).join(', ')}`);

  // --- Prerequisite 1: the question types -------------------------------
  for (const type of QUESTION_TYPES) {
    await prisma.questionType.upsert({
      where: { id: type.id },
      create: { id: type.id, district: 'ENGLISH', name: type.name, mechanic: type.mechanic },
      update: { name: type.name, mechanic: type.mechanic },
    });
  }
  console.log(`Question types registered: ${QUESTION_TYPES.length}`);

  // --- Prerequisite 2: the misconceptions authoring raised ---------------
  let newMisconceptions = 0;
  for (const batch of batches) {
    for (const proposal of batch.proposedMisconceptions ?? []) {
      if (await prisma.misconception.findUnique({ where: { id: proposal.id } })) continue;
      await prisma.misconception.create({
        data: {
          id: proposal.id,
          district: 'ENGLISH',
          description: proposal.description,
          childHint: proposal.childHint,
          status: 'PROPOSED',
          proposedBy: proposal.proposedBy ?? 'ai-draft:cowork-okafor-v1',
          sourcePattern: `corpus:${batch.batchId}#${proposal.id}`,
        },
      });
      newMisconceptions += 1;
    }
  }
  console.log(`Misconceptions raised by authoring, landed PROPOSED: ${newMisconceptions}`);

  const lowConfidence = new Set(
    batches.flatMap((batch) => (batch.lowestConfidence ?? []).map((entry) => entry.itemId)),
  );

  // --- The items ---------------------------------------------------------
  let created = 0;
  let existing = 0;
  const gateFailures: ContentFailure[] = [];
  const missingTags: string[] = [];
  const quoteFieldFaults: string[] = [];

  for (const batch of batches) {
    for (const item of batch.items) {
      if (await prisma.item.findUnique({ where: { id: item.itemId } })) {
        existing += 1;
        continue;
      }
      const prompt = item.stem.text ?? item.stem.prompt ?? '';

      // The gates, on the way in. Reported, never silently dropped.
      const mechanic = QUESTION_TYPES.find((type) => type.id === item.questionTypeId)?.mechanic;
      // THE CANONICAL FIELD IS `text`. WS-REDRAFT-3 wrote the declared span as
      // `span`, and because every consumer reads `quote.text` all six R4
      // declarations would have imported as undefined — the exemption would
      // vanish silently and the stems would fail the cap again with no trace
      // of why. Same class of defect as the cloze lineRefs/gapRef mismatch:
      // a field-name mismatch that reads as absence. Reported loudly, not
      // guessed at.
      for (const quote of item.quotes ?? []) {
        const loose = quote as unknown as Record<string, unknown>;
        if (!quote.text && typeof loose.span === 'string') {
          quoteFieldFaults.push(`${item.itemId}: declared quote uses "span"; the canonical field is "text"`);
        }
      }
      const quotedSpans = (item.quotes ?? []).map((quote) => quote.text).filter(Boolean);
      gateFailures.push(
        ...checkChildFacingText({
          role: roleForItemStem(mechanic),
          label: `${item.itemId} stem`,
          text: prompt,
          quotedSpans,
          testedTokens: item.testedTokens ?? [],
        }),
      );
      for (const option of item.options) {
        gateFailures.push(
          ...checkChildFacingText({
            role: 'item-option',
            label: `${item.itemId} option ${option.label ?? ''}`.trim(),
            text: option.content,
            testedTokens: item.testedTokens ?? [],
          }),
        );
        // P3: every wrong option carries a misconception before it can go LIVE.
        if (!option.isCorrect && !option.misconceptionId) {
          missingTags.push(`${item.itemId} option ${option.label ?? '?'}`);
        }
      }

      await prisma.item.create({
        data: {
          id: item.itemId,
          questionTypeId: item.questionTypeId,
          difficultyTier: item.difficultyTier,
          // Canonical shapes (ratified 2026-08-02): passageRef and lineRefs
          // live in the stem for the MC model, in exactly these names.
          stem: {
            prompt,
            ...(item.passageRef ? { passageRef: item.passageRef } : {}),
            // A cloze item's citation is a GAP, not a line (renamed
            // 2026-08-02). Resolved as a line number it was always "in
            // range", so the citation certified itself; the field name is
            // what stops that happening again.
            ...(item.lineRefs?.length
              ? mechanic === 'cloze'
                ? { gapRef: item.lineRefs[0] }
                : { lineRefs: item.lineRefs }
              : {}),
            ...(item.quotes?.length ? { quotes: item.quotes } : {}),
            ...(item.testedTokens?.length ? { testedTokens: item.testedTokens } : {}),
          },
          explanation: {
            ...(item.explanation ?? {}),
            ...(item.preReview ? { preReview: item.preReview } : {}),
            ...(lowConfidence.has(item.itemId) ? { lowConfidence: true } : {}),
          },
          status: 'DRAFT',
          pool: (batch.pool as 'PRACTICE' | 'MOCK') ?? 'PRACTICE',
          authoredBy: item.authoredBy ?? 'ai-draft:cowork-okafor-v1',
          options: {
            create: item.options.map((option) => ({
              content: { value: option.content, ...(option.label ? { label: option.label } : {}) },
              isCorrect: option.isCorrect,
              misconceptionId: option.misconceptionId ?? null,
            })),
          },
        },
      });
      created += 1;
    }
  }

  console.log(`\nItems imported as DRAFT: ${created}${existing ? ` (${existing} already present)` : ''}`);
  console.log(`Flagged low-confidence by the authoring pass: ${lowConfidence.size}`);

  if (missingTags.length > 0) {
    console.log(`\nP3 — wrong options with NO misconception tag (${missingTags.length}):`);
    for (const entry of missingTags.slice(0, 10)) console.log(`  · ${entry}`);
  }

  if (quoteFieldFaults.length > 0) {
    console.log(`\nDECLARED QUOTES THAT WOULD HAVE BEEN LOST (${quoteFieldFaults.length}):`);
    for (const fault of quoteFieldFaults) console.log(`  ✗ ${fault}`);
  }

  if (gateFailures.length > 0) {
    const byRule = gateFailures.reduce<Record<string, number>>((acc, failure) => {
      acc[failure.rule] = (acc[failure.rule] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `\nGATE FAILURES on import (${gateFailures.length}) — ` +
        Object.entries(byRule).map(([rule, count]) => `${rule}: ${count}`).join(', '),
    );
    for (const failure of gateFailures) console.log(`  ✗ ${failure.where}: ${failure.detail}`);
  } else {
    console.log('\nAll imported items pass the child-facing gates.');
  }
  await prisma.$disconnect();
}

void main();
