/**
 * REDRAFT PACKET (R1047): the held vault drafts whose ONLY faults are wording, with each card's
 * current stored text, the reviewer's round-2 HOLD reason verbatim, and the LIVE items it sits on.
 * Tier, twoMeanings and likelierKnown are FIXED here: changing them is family composition and needs
 * a ruling, so the redraft door refuses any change to them. Reads the store, never a copy (R60).
 *
 *   tsx scripts/agent-review/export-vault-redraft-packet.ts hostile vague …
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const DIR = join(__dirname, '..', '..', 'content', 'agent-review', 'vault');
/** `--hold=<file>`: read the HOLD from a single-card review file instead of review-V1 (R1059). */
const HOLD_FILE = process.argv.find((a) => a.startsWith('--hold='))?.slice(7);
const BATCH_NAME = process.argv.find((a) => a.startsWith('--batch='))?.slice(8) ?? 'V2';
async function main() {
  const heads = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  requirePopulation('vault redraft packet', { 'headwords named': heads.length });
  const review = JSON.parse(readFileSync(join(DIR, 'review-V1.json'), 'utf8')) as { drafts: Array<{ headword: string; verdict: string; reason: string }> };
  const cards = [];
  for (const h of heads) {
    const w = await prisma.word.findFirstOrThrow({ where: { headword: h } });
    const hold = HOLD_FILE ? (JSON.parse(readFileSync(join(DIR, HOLD_FILE), 'utf8')) as { wordId: string; verdict: string; reason: string }) : review.drafts.find((d) => d.headword === h);
    if (w.status !== 'DRAFT' || hold?.verdict !== 'HOLD') throw new Error(`${h}: expected a DRAFT row held in review (got ${w.status}, ${hold?.verdict})`);
    cards.push({
      fixed: { headword: h, tier: w.tier, twoMeanings: w.twoMeanings, likelierKnown: w.likelierKnown },
      current: { wordClass: w.wordClass, definitionChild: w.definitionChild, sentence: w.sentence,
        senseB: w.twoMeanings ? { definition: w.senseBDefinition, sentence: w.senseBSentence, wordClass: w.senseBWordClass } : null, likelierKnownNote: w.likelierKnownNote, imagePrompt: w.imagePrompt },
      reviewerHold: hold.reason,
      // READ FROM THE STORE, never from packet.json (R1059): that copy was cut at the start of R1045 and
      // showed transparent's items at T5 after R1054 had moved both to T3 (R60's third question).
      liveItems: (await prisma.item.findMany({ where: { status: 'LIVE' }, select: { id: true, questionTypeId: true, difficultyTier: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } }))
        .filter((i) => ((i.stem as { words?: unknown[] }).words ?? []).map((x) => String(x).toLowerCase()).includes(h))
        .map((i) => ({ itemId: i.id, questionType: i.questionTypeId, itemTier: i.difficultyTier, prompt: (i.stem as { prompt?: string }).prompt,
          key: i.options.filter((o) => o.isCorrect).map((o) => (o.content as { value?: string }).value), options: i.options.map((o) => (o.content as { value?: string }).value) })),
    });
  }
  writeFileSync(join(DIR, `redraft-${BATCH_NAME}-packet.json`), JSON.stringify({ batch: BATCH_NAME, cards }, null, 2) + '\n');
  console.log(`redraft packet ${BATCH_NAME}: ${cards.length} cards`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
