/**
 * WRITES UNGUARDED TO REVIEWED CONTENT — read this before re-running it.
 *
 * This script transcribes a written ruling into content a reviewer owns, and it does NOT classify
 * before writing (`packages/db/prisma/reviewed-guard.ts`). That is deliberate: the values here were
 * authored by a human, not computed, so the guard would refuse the very change the script exists to
 * apply. What it means for YOU is that re-running this on a database carrying rulings will overwrite
 * whatever is there now with what is written below — including anything a reviewer has changed since.
 *
 * It was written to run ONCE and has already run. Before running it again, check that what it
 * writes is still the current ruling; if it is not, this will quietly undo the newer one.
 */
/**
 * ENG-002-pp-21 — the hint goes BACK to the name (annie's ruling, 2026-08-08).
 * The rewording satisfied a rule that does not apply: under R23 a passage proper noun may be
 * DECLARED, so `Elizabeth` never needed removing. It was a cost paid for nothing.
 *
 * `semicolon` is still ours and still four syllables, so it stays the item's one long word —
 * which the ceiling permits (max 1). Declaring the name is what makes the original hint legal.
 */
import { prisma } from '../packages/db/src/index';

const HINT = 'The words after the semicolon describe Elizabeth. Use them.';

async function main(): Promise<void> {
  const item = await prisma.item.findUnique({ where: { id: 'ENG-002-pp-21' } });
  if (!item) { console.log('MISSING'); return; }
  const ex = { ...((item.explanation ?? {}) as Record<string, unknown>) };
  const stem = { ...((item.stem ?? {}) as Record<string, unknown>) };
  const before = String(ex.hintCore ?? '');
  ex.hintCore = HINT;
  stem.passageNames = ['Elizabeth'];
  await prisma.item.update({ where: { id: 'ENG-002-pp-21' }, data: { explanation: ex as never, stem: stem as never } });
  console.log(`before: "${before}"`);
  console.log(`after : "${HINT}"`);
  console.log(`stem.passageNames: ["Elizabeth"]`);
  await prisma.$disconnect();
}

void main();
