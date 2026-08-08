/**
 * Import the MERGED English batch files back into the DB (David, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-merged-english-batches.ts`
 *
 * The one-direction rule in CLAUDE.md: Cowork authors item content, the DB holds. This is the
 * normal inbound path. Two guards it also requires:
 *   · DIFF BEFORE IMPORTING — every changed field is listed, so an import is never a silent write.
 *   · GATE ON THE WAY IN — each incoming field runs the child-facing gate FIRST. Anything that
 *     fails is REPORTED AND SKIPPED, never written. A clean queue is not traded for a sync.
 *
 * Source is the merged export (Cowork canonical + only the gate-forced fields), not Cowork's raw
 * canonical: as of this run the canonical had NOT absorbed the R22 urgency rewording, so importing
 * it directly would reintroduce two failures the gate has already cleared.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const SOURCES = [
  '/Users/davidb/Downloads/11+/from-cluecrew/english-batch-eng-001-wind-in-willows-ba33a61248f0857b.json',
  '/Users/davidb/Downloads/11+/from-cluecrew/english-batch-eng-002-pride-prejudice-5b78fdbfc94e3031.json',
];
const FIELDS = ['walkScript', 'hintCore'] as const;

async function main(): Promise<void> {
  let changed = 0, skipped = 0, quoteWrites = 0;
  for (const path of SOURCES) {
    const batch = JSON.parse(readFileSync(path, 'utf8')) as { items: Array<Record<string, unknown>> };
    for (const src of batch.items) {
      const item = await prisma.item.findUnique({ where: { id: src.itemId } });
      if (!item) { console.log(`  MISSING IN DB: ${src.itemId}`); continue; }
      const ex = { ...((item.explanation ?? {}) as Record<string, unknown>) };
      const incoming = (src.explanation ?? {}) as Record<string, unknown>;
      let dirty = false;

      for (const f of FIELDS) {
        const before = String(ex[f] ?? ''), after = String(incoming[f] ?? '');
        if (!after || before === after) continue;
        const fails = checkChildFacingText({ role: 'hint', label: `${src.itemId}.${f}`, text: after }).filter(isBlocking);
        if (fails.length) {
          skipped += 1;
          console.log(`  SKIPPED ${src.itemId}.${f} — incoming text FAILS the gate: ${fails.map((x) => x.detail).join('; ')}`);
          continue;
        }
        console.log(`  ${src.itemId}.${f}\n     was: ${before.slice(0, 76)}\n     now: ${after.slice(0, 76)}`);
        ex[f] = after; dirty = true; changed += 1;
      }

      // R23 quotation declarations — carried across so the ceiling exemption resolves.
      const inQ = JSON.stringify(incoming.quotes ?? []), haveQ = JSON.stringify(ex.quotes ?? []);
      if (incoming.quotes && inQ !== haveQ) {
        ex.quotes = incoming.quotes; dirty = true; quoteWrites += 1;
        console.log(`  ${src.itemId}.quotes → ${(incoming.quotes as Array<{ text: string }>).map((q) => `"${q.text}"`).join(', ')}`);
      }
      if (dirty) await prisma.item.update({ where: { id: src.itemId }, data: { explanation: ex as never } });
    }
  }
  console.log(`\n${changed} field(s) imported · ${quoteWrites} quotation set(s) · ${skipped} SKIPPED for failing the gate.`);
  await prisma.$disconnect();
}

void main();
