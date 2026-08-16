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

/**
 * DESCRIPTION IS COMPARED, AND UNTIL NOW IT NEVER WAS.
 *
 * Every comparison between the two stores has been run on `childHint` — the field a child reads —
 * and `description` was assumed to follow. It does not: `en-vocab-dominant-sense` carries a SCOPING
 * SENTENCE on the drafting side that this store has never held, and that sentence is the entire
 * justification for a tag placement in the SERVING store. **The hints were hiding it.**
 *
 * A description is not decoration. It is what a drafter reads to decide whether a tag fits, so a
 * sentence present on one side and absent on the other means the two stores are applying different
 * rules while reporting the same tag.
 */
const COMPARED = ['childHint', 'description', 'status'] as const;

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) { console.error('usage: pnpm check:library-agreement <their-emission.json>'); process.exit(1); }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  // THEIR KEY IS NOT OURS TO ASSUME. Deliveries have used `libraryEntries`, `entries` and
  // `misconceptions`; reading only one and finding nothing would report an empty screen as a
  // problem with them. Every known shape is tried and the one that answered is NAMED in the output,
  // so a future rename surfaces as an unrecognised shape rather than as a silent zero.
  const payload = (raw.payload ?? raw) as Record<string, unknown>;
  const SHAPES = ['libraryEntries', 'entries', 'misconceptions'] as const;
  const key = SHAPES.find((k) => Array.isArray(payload[k]) && (payload[k] as unknown[]).length > 0);
  if (!key) {
    console.error(`REFUSED: no recognised entry list. Tried ${SHAPES.join(', ')}; payload carries `
      + `${Object.keys(payload).join(', ')}. An unrecognised shape is not an empty one.`);
    process.exit(1);
  }
  console.log(`Reading their entries from \`${key}\`.`);
  const theirs = payload[key] as Array<Record<string, unknown>>;
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
      // NULL IS NOT-STATED, NOT A VALUE. This emission carries `status: null` on all 28 because it
      // sent hints and descriptions only — counting those as 28 disagreements would be the
      // unstated-denominator fault arriving inside the check written to avoid it.
      if (t[f] === undefined || t[f] === null) { notStated.push(`${id}.${f}`); continue; }
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
