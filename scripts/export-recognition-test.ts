/**
 * THE RECOGNITION TEST, STAGED FOR ANNIE — her narrowed standard, not mine.
 *
 * **NOT "does the card answer the item in different words".** Her standard is sharper and it is the
 * one that decides: **does answering from the card require ANY STEP BEYOND RECOGNITION?** A card
 * that needs a child to think — to hold two senses apart, to notice which of two near-words fits —
 * is doing the item's teaching. A card she can simply recognise the answer in is doing the item's
 * work.
 *
 * **SHE SAYS IT IS ANSWERABLE BY A READER IN SECONDS, SO THIS DOES NOT JUDGE IT.** Every one of the
 * 40 LIVE joined items is staged with its card, its key and its distractors, in reading order.
 * **What it does do is flag the string-match cases first**, so her read starts where the faults
 * already are rather than at item one.
 *
 * The 32 machine-visible collisions are marked. **The rest are the population the machine cannot
 * see** (R316) — and they are the reason this is a reading rather than a report.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isCardHeld, tierRequirementApplies } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'recognition-test-for-annie';

async function main() {
  const words = await prisma.word.findMany();
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: true }, orderBy: { id: 'asc' } });
  const vocab = items.filter((i) => tierRequirementApplies(i.questionTypeId) === true);
  const joined = vocab.filter((i) => vault.has(String((((i.stem as { words?: unknown[] }).words ?? [])[0] ?? '')).toLowerCase()));
  requirePopulation('recognition test', { 'LIVE vocabulary items': vocab.length, 'joined to a card': joined.length });

  const rows = joined.map((item) => {
    const headword = String((((item.stem as { words?: unknown[] }).words ?? [])[0] ?? ''));
    const card = vault.get(headword.toLowerCase())!;
    const key = String(((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? '');
    const distractors = item.options.filter((o) => !o.isCorrect)
      .map((o) => String((o.content as { value?: string }).value ?? ''));
    const stringMatch = card.definitionChild?.toLowerCase().includes(key.toLowerCase()) ?? false;
    return {
      itemId: item.id,
      alreadyFlagged: isCardHeld(headword),
      stringMatchOnTheKey: stringMatch,
      headword,
      cardStatus: card.status,
      cardDefinition: card.definitionChild,
      cardSentence: card.sentence,
      key,
      distractors,
      herQuestion: 'Does answering from the card require any step beyond recognition?',
    };
  });
  // Flagged first, so her read starts where the faults are.
  rows.sort((a, b) => Number(b.alreadyFlagged) - Number(a.alreadyFlagged) || a.headword.localeCompare(b.headword));

  const payload = {
    what: "The 40 LIVE vocabulary items joined to a Word card, staged for Annie's recognition read.",
    herStandard:
      'NOT "does the card answer the item in different words" — but "does answering from the card require any step beyond recognition?" A card a child can simply recognise the answer in is doing the item\'s work.',
    whyThisIsStagedAndNotJudged:
      'She says it is answerable by a reader in seconds. A machine judging it would substitute a string test for the judgement she named.',
    readingOrder: 'The 20 already held for a string match come first, so the read starts where the faults are.',
    denominators: {
      liveVocabularyItems: vocab.length,
      joinedToACard: joined.length,
      alreadyHeldForAStringMatch: rows.filter((r) => r.alreadyFlagged).length,
      remainingForHerJudgementAlone: rows.filter((r) => !r.alreadyFlagged).length,
    },
    rows,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'the 40 LIVE card-joined vocabulary items with card, key and distractors, flagged cases first', ['rows']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nLIVE vocabulary items ${vocab.length} · joined to a card ${joined.length}`);
  console.log(`  already held for a string match : ${payload.denominators.alreadyHeldForAStringMatch}`);
  console.log(`  for her judgement alone         : ${payload.denominators.remainingForHerJudgementAlone}`);
  await prisma.$disconnect();
}

main();
