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
async function main() {
  const heads = process.argv.slice(2);
  requirePopulation('vault redraft packet', { 'headwords named': heads.length });
  const review = JSON.parse(readFileSync(join(DIR, 'review-V1.json'), 'utf8')) as { drafts: Array<{ headword: string; verdict: string; reason: string }> };
  const old = JSON.parse(readFileSync(join(DIR, 'packet.json'), 'utf8')) as { drafts: Array<{ card: { headword: string }; liveItems: unknown[] }> };
  const cards = [];
  for (const h of heads) {
    const w = await prisma.word.findFirstOrThrow({ where: { headword: h } });
    const hold = review.drafts.find((d) => d.headword === h);
    if (w.status !== 'DRAFT' || hold?.verdict !== 'HOLD') throw new Error(`${h}: expected a DRAFT row held in review-V1 (got ${w.status}, ${hold?.verdict})`);
    cards.push({
      fixed: { headword: h, tier: w.tier, twoMeanings: w.twoMeanings, likelierKnown: w.likelierKnown },
      current: { wordClass: w.wordClass, definitionChild: w.definitionChild, sentence: w.sentence,
        senseB: w.twoMeanings ? { definition: w.senseBDefinition, sentence: w.senseBSentence, wordClass: w.senseBWordClass } : null, likelierKnownNote: w.likelierKnownNote },
      reviewerHold: hold.reason,
      liveItems: old.drafts.find((d) => d.card.headword.toLowerCase() === h)?.liveItems ?? [],
    });
  }
  writeFileSync(join(DIR, 'redraft-V2-packet.json'), JSON.stringify({ batch: 'V2', cards }, null, 2) + '\n');
  console.log(`redraft packet V2: ${cards.length} cards`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
