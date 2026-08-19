/**
 * THE FIFTEEN HEADWORDS FOR ANNIE'S READ — and it is a REVIEW, not a confirmation.
 *
 * **THE QUESTION DAVID ASKED DECIDES THE SIZE OF THE JOB, AND THE ANSWER IS THE HARDER ONE.** Is a
 * published tier on an already-authored judgement a fresh review or a confirmation? **A fresh
 * review.** Measured on the rows themselves:
 *
 *   · `authoredBy: ai-draft:cowork-okafor-v1` — **the tier was drafted by a machine**;
 *   · `preReviewVerdict: PASS_TO_HUMAN` — the draft pipeline's own verdict is that a person must
 *     look;
 *   · **ZERO attribution events** across all 183 DRAFT vault rows — **no human has ever signed one.**
 *
 * So "the judgement exists" is true only in the sense that a draft carries a number. **Nobody has
 * judged it.** I wrote "no new judgement" about this work and that was wrong.
 *
 * **AND THE READ IS WIDER THAN THE TIER.** Each row carries `definitionChild` and `sentence` —
 * both child-facing, both served on the Word card — so publishing means reading the whole card, not
 * checking a number. **Fifteen reads of three child-facing fields each, not fifteen confirmations.**
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking, tierRequirementApplies } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'fifteen-headwords-for-annie';

async function main() {
  const items = await prisma.item.findMany({
    where: { status: 'LIVE' },
    select: { id: true, questionTypeId: true, stem: true, options: { select: { content: true, isCorrect: true } } },
    orderBy: { id: 'asc' },
  });
  const headwordItems = items.filter((i) => tierRequirementApplies(i.questionTypeId) === true);
  const words = await prisma.word.findMany();
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));

  const rows = headwordItems.flatMap((item) => {
    const stem = String((((item.stem as { words?: unknown[] }).words ?? [])[0] ?? '')).toLowerCase();
    const entry = vault.get(stem);
    if (!entry || entry.status === 'LIVE') return [];
    const key = ((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? null;
    const gate = (text: string, role: 'word-card' | 'hint') =>
      checkChildFacingText({ role, label: `${entry.headword}`, text, headwordInOwnCard: entry.headword })
        .filter(isBlocking).map((f) => `${f.rule}: ${f.detail}`);
    return [{
      headword: entry.headword,
      tier: entry.tier,
      status: entry.status,
      // R25 — the values she reads, verbatim, not a description of them.
      definitionChild: entry.definitionChild,
      sentence: entry.sentence,
      wordClass: entry.wordClass,
      twoMeanings: entry.twoMeanings,
      authoredBy: entry.authoredBy,
      preReviewVerdict: entry.preReviewVerdict,
      humanSignatures: 0,
      servesOnItem: item.id,
      itemKey: key,
      gateOnDefinition: gate(entry.definitionChild ?? '', 'word-card'),
      gateOnSentence: gate(entry.sentence ?? '', 'word-card'),
    }];
  });
  requirePopulation('fifteen headwords', {
    'LIVE headword-under-test items': headwordItems.length,
    'headwords with a DRAFT vault row': rows.length,
  });

  const payload = {
    what: 'The headwords served on LIVE vocabulary items whose vault row is DRAFT. For Annie, for the read that publication needs.',
    whatHerReadCovers: {
      question: 'Is a published tier on an already-authored judgement a fresh review or a confirmation?',
      answer: 'A FRESH REVIEW.',
      why: [
        'authoredBy is ai-draft:cowork-okafor-v1 — the tier was drafted by a machine, not judged by a person.',
        'preReviewVerdict is PASS_TO_HUMAN — the draft pipeline itself says a person must look.',
        'ZERO attribution events across all 183 DRAFT vault rows. No human has ever signed one.',
      ],
      andItIsWiderThanTheTier:
        'Each row carries definitionChild and sentence, both child-facing and both served on the Word card. Publishing means reading the whole card, not checking a number.',
      soTheSize: `${rows.length} reads of three child-facing fields each — not ${rows.length} confirmations.`,
    },
    changedBeforeThisPackReachedHer: {
      headword: 'futile',
      field: 'definitionChild',
      was: 'certain to fail, so not worth doing at all.',
      now: 'certain to come to nothing, so not worth doing at all.',
      why: 'The gate had already caught it — "fail" is banned child-facing under D1 — and sending a known blocker would have spent her attention on something a machine had found.',
      scope: 'Only the banned clause moved. The rest of the definition is the drafter\'s, so what she reads is their card minus the one word the gate refuses.',
      rowState: 'DRAFT and unsigned, so no approval was overwritten.',
    },
    correctionToMyOwnClaim: {
      iSaid: 'Publishing these turns fifteen of the forty vr-04 pairs from unmeasurable to measurable, with no new judgement.',
      measured: 'BOTH HALVES WERE WRONG. It makes ONE pair measurable (bold -> brave), because all 40 stems already have vault entries and ZERO keys do except brave, which is itself another item stem. And the tier is a machine draft, so publishing it IS a new judgement.',
      whatWouldActuallyMakeThePairsMeasurable: '39 KEY words need vault entries. The vault covers stems and not keys, which no count of stem rows can fix.',
    },
    rows,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'the DRAFT-vault headwords served on LIVE vocabulary items, with their child-facing fields verbatim', ['rows']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nheadwords for her read: ${rows.length}`);
  console.log(`  gate faults on definitions: ${rows.filter((r) => r.gateOnDefinition.length).length}`);
  console.log(`  gate faults on sentences  : ${rows.filter((r) => r.gateOnSentence.length).length}`);
  for (const r of rows) console.log(`    ${r.headword.padEnd(13)} tier ${r.tier} · ${r.servesOnItem}`);
  await prisma.$disconnect();
}

main();
