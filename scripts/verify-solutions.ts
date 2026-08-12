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
import { declareMayBeEmpty } from './lib/population';

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
  // R61: this gate is named for a population the pipeline has never produced. A printed count
  // did not save it — "0 MATHS items checked" appeared in every CI run and still read as a pass.
  // The emptiness is legitimate (there is genuinely nothing to verify), so it is DECLARED rather
  // than treated as a pipeline failure, and the reason prints on every empty run.
  declareMayBeEmpty(
    'Solution verification (Maths)',
    'MATHS items',
    items.length,
    'No code path creates a MATHS questionType — only misconceptions carry district MATHS. The ' +
      'district has generators (13,173 items sweep clean in memory) but no persistence path, so ' +
      'no maths item has ever reached the database. Remove this declaration the moment one does.',
  );
  await prisma.$disconnect();
}

void main();
