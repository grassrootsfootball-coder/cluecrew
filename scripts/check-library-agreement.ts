/**
 * DO THE TWO STORES HOLD THE SAME LIBRARY TEXT? — `pnpm check:library-agreement <their-emission.json>`
 *
 * The DB authors library text and Cowork proposes transforms against quoted DB text (CLAUDE.md). So
 * an emission from Cowork is not an import — it is a CLAIM ABOUT ITS OWN STATE, and the only useful
 * thing to do with it is compare. This never writes.
 *
 * WHY IT EXISTS. Delivery 83 said "our side now reads the same as yours on the nine" and **7 of the
 * 9 childHints differed**. Every one of Cowork's was shorter, at 13-16 words against our 17-23 — its
 * own 16-word cap, applied to text the reviewer had already approved in our wording, because the
 * approval sheet renders this store verbatim. The cap did silently to seven entries what it would
 * have done visibly to `en-determiner-omitted`.
 *
 * COMPARE BYTES, NOT MEANING, AND REPORT THE FIELDS THEY DID NOT STATE. A field absent from their
 * emission is NOT agreement — it is a field nobody compared, and counting it as a match is the
 * unstated-denominator fault (R60). Reported separately and loudly.
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const COMPARED = ['childHint', 'description', 'status'] as const;

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) { console.error('usage: pnpm check:library-agreement <their-emission.json>'); process.exit(1); }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const payload = (raw.payload ?? raw) as { libraryEntries?: Array<Record<string, unknown>> };
  const theirs = payload.libraryEntries ?? [];
  requirePopulation('check:library-agreement', { 'entries in their emission': theirs.length });

  const ids = theirs.map((e) => String(e.id));
  const ours = await prisma.misconception.findMany({ where: { id: { in: ids } } });
  const byId = new Map(ours.map((o) => [o.id, o as unknown as Record<string, unknown>]));

  const differ: string[] = [];
  const notStated: string[] = [];
  const missing: string[] = [];

  for (const t of theirs) {
    const id = String(t.id);
    const o = byId.get(id);
    if (!o) { missing.push(id); continue; }
    for (const f of COMPARED) {
      if (t[f] === undefined) { notStated.push(`${id}.${f}`); continue; }
      if (JSON.stringify(t[f]) !== JSON.stringify(o[f])) {
        differ.push(`${id}.${f}`);
        console.log(`\n${id}.${f}`);
        console.log(`   theirs (${String(t[f]).length} ch): ${JSON.stringify(t[f])}`);
        console.log(`   ours   (${String(o[f]).length} ch): ${JSON.stringify(o[f])}`);
        if (f === 'childHint') {
          const tw = String(t[f]).trim().split(/\s+/).length;
          const ow = String(o[f]).trim().split(/\s+/).length;
          console.log(`   words: theirs ${tw}, ours ${ow}`
            + (tw < ow ? '  <- THEIRS IS SHORTER. Check it is not the 16-word cap rewriting approved text.' : ''));
        }
      }
    }
  }

  const compared = theirs.length * COMPARED.length - notStated.length;
  console.log(`\n${theirs.length} entries · ${compared} field comparisons made · ${differ.length} DIFFER`);
  if (missing.length) console.log(`  ${missing.length} entry/entries not in this store: ${missing.join(', ')}`);
  if (notStated.length) {
    console.log(`  ${notStated.length} field(s) THEY DID NOT STATE — not compared, and NOT agreement:`);
    console.log(`    ${notStated.join(', ')}`);
  }
  console.log(differ.length === 0 && missing.length === 0
    ? '\n  IDENTICAL on every field both sides stated.'
    : '\n  NOT IDENTICAL. The DB authors library text: their copy follows ours, never the reverse.');
  await prisma.$disconnect();
  process.exit(differ.length === 0 && missing.length === 0 ? 0 : 1);
}

void main();
