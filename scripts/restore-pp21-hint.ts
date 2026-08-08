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
