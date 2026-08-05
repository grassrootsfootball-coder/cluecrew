/**
 * vr-07 code letters out of the option-label range (David's ruling, 2026-08-02).
 *
 * "If A = 3, B = 4, C = 5, D = 6, what is A + B + C?" over options the
 * interface labels A–E. Two namespaces, one set of glyphs. A→P, B→Q, C→R, D→S
 * moves the item's own symbols clear of A–E with letters that carry no
 * arithmetic connotation of their own.
 *
 * Rewrites all three places the symbols live — `code` keys, `sum`, and the
 * prompt a child reads — and re-runs the collision check before writing.
 */
import { checkLabelCollision } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const MAP: Record<string, string> = { A: 'P', B: 'Q', C: 'R', D: 'S' };
const ACTOR = 'david@cluecrew.test';

/** Word-bounded so "A" the symbol moves and "a" the article does not. */
function remap(text: string): string {
  return text.replace(/\b[A-D]\b/g, (letter) => MAP[letter] ?? letter);
}

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: ACTOR }, select: { id: true } });
  if (!operator) throw new Error(`${ACTOR} is not an account on this system`);

  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-07-letters-for-numbers' },
    include: { options: true },
    orderBy: { id: 'asc' },
  });

  let changed = 0;
  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const code = (stem.code ?? {}) as Record<string, string>;
    const nextCode = Object.fromEntries(Object.entries(code).map(([k, v]) => [MAP[k] ?? k, v]));
    const nextSum = typeof stem.sum === 'string' ? remap(stem.sum) : stem.sum;
    const nextPrompt = typeof stem.prompt === 'string' ? remap(stem.prompt) : stem.prompt;
    if (JSON.stringify([nextCode, nextSum, nextPrompt]) === JSON.stringify([code, stem.sum, stem.prompt])) continue;

    const remaining = checkLabelCollision({
      label: `item:${item.id}`,
      symbols: Object.keys(nextCode),
      optionCount: item.options.length,
      optionLabels: item.options.map((option) => (option.content as { label?: string }).label),
    });
    if (remaining.length > 0) {
      console.log(`  ✗ ${item.id}: still collides after remapping — NOT applied`);
      for (const f of remaining) console.log(`      ${f.detail}`);
      continue;
    }

    if (changed < 2) {
      console.log(`  ${item.id}`);
      console.log(`     was: ${String(stem.prompt)}`);
      console.log(`     now: ${String(nextPrompt)}`);
    }
    changed += 1;
    if (DRY) continue;
    await prisma.item.update({
      where: { id: item.id },
      data: { stem: { ...stem, code: nextCode, sum: nextSum, prompt: nextPrompt } },
    });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'item.stem_rewritten_recorded',
        targetKind: 'Item',
        targetId: item.id,
        detail: {
          writtenBy: `human:${ACTOR}`,
          recordedBy: `human:${ACTOR}`,
          authorship: 'direct',
          method: 'label-collision ruling, 2026-08-02',
          before: stem.prompt,
          after: nextPrompt,
          why: 'The item defined A-D as its own symbols while the interface labels the options A-E. Same glyph, two meanings.',
        },
      },
    });
  }
  console.log(`\n${DRY ? '--dry-run: nothing written. ' : ''}vr-07 items remapped: ${changed}/${items.length}`);
  await prisma.$disconnect();
}

void main();
