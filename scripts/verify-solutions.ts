/**
 * Solution-verification CI (BUILD-DISTRICT-MATHS §5, gate #3): every
 * MATHS-district item must carry a `solution` expression, and the computed
 * value must equal the keyed correct option. A wrong key fails the build —
 * an AI-drafted item cannot ship one.
 *
 * Run: pnpm verify:solutions  (CI runs it after seed, before e2e)
 */
import { checkSolution } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' }, status: { not: 'RETIRED' } },
    include: { options: true },
  });

  const failures: string[] = [];
  for (const item of items) {
    if (!item.solution) {
      failures.push(`${item.id}: MATHS item without a solution expression`);
      continue;
    }
    const result = checkSolution(
      item.solution,
      item.options.map((option) => ({ content: option.content, isCorrect: option.isCorrect })),
    );
    if (!result.ok) {
      failures.push(
        `${item.id}: ${result.reason} (computed=${result.computed}, keyed=${result.keyed})`,
      );
    }
  }

  if (failures.length > 0) {
    console.error(`Solution verification FAILED (${failures.length} of ${items.length} items):`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(`Solution verification passed (${items.length} MATHS items checked).`);
  await prisma.$disconnect();
}

void main();
