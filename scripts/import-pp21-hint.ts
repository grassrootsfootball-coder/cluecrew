/**
 * ENG-002-pp-21 — the redrafted hint (annie, via David, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-pp21-hint.ts`
 *
 * Both long words were OURS, not the passage's — `semicolon` is our metalanguage and `Elizabeth`
 * the hint's own reference — so both go by REWORDING. Contrast ENG-001-WIW-10, where
 * `contemptuous` is the PASSAGE's word and was cleared by DECLARING it as an R4 quotation.
 * The two declared quotations on this item are re-asserted so the gate (which now reads
 * `explanation.quotes`) can resolve them.
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const HINT = "Read on past 'spirit'. The rest of the sentence tells you what she was like.";
const SRC = '/Users/davidb/Downloads/ENG002prideprejudice (1).json';

async function main(): Promise<void> {
  const item = await prisma.item.findUnique({ where: { id: 'ENG-002-pp-21' } });
  if (!item) { console.log('MISSING ENG-002-pp-21'); return; }
  const batch = JSON.parse(readFileSync(SRC, 'utf8')) as { items: Array<Record<string, any>> };
  const src = batch.items.find((i) => i.itemId === 'ENG-002-pp-21');

  const ex = { ...((item.explanation ?? {}) as Record<string, unknown>) };
  const before = String(ex.hintCore ?? '');
  ex.hintCore = HINT;
  ex.quotes = src?.explanation?.quotes ?? ex.quotes;
  await prisma.item.update({ where: { id: 'ENG-002-pp-21' }, data: { explanation: ex as never } });

  console.log(`hint before: "${before}"`);
  console.log(`hint after : "${HINT}"`);
  console.log(`quotations declared: ${((ex.quotes as unknown[]) ?? []).length}`);
  await prisma.$disconnect();
}

void main();
