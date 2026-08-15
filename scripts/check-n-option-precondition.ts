/**
 * `en-n-option-avoidance` REQUIRES AN N OPTION TO AVOID — `pnpm check:n-option-precondition`
 *
 * A precondition gate, not a zero-carrier gate. The tag describes a child who will not pick the
 * "no mistake here" option; on an item that offers no such option it describes an avoidance the
 * child could not have committed, and the hint would coach against a choice that was never there.
 *
 * NOT A ZERO-CARRIER GATE, stated because the distinction decides how an empty result reads.
 * The tag has live carriers and ENG-003 holds 18 of 34 items WITH an N option, so it may
 * legitimately carry the tag once retagged. Zero failures here is a real pass over a real
 * population — not the vacuum R61 describes.
 *
 * The N definition lives in `packages/core/src/english/n-option.ts` and is called, never restated.
 */
import { hasNOption } from '../packages/core/src/english/n-option';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const TAG = 'en-n-option-avoidance';

async function main(): Promise<void> {
  const carriers = await prisma.itemOption.findMany({
    where: { misconceptionId: TAG },
    select: { id: true, itemId: true },
  });
  const itemIds = [...new Set(carriers.map((c) => c.itemId))];
  const items = await prisma.item.findMany({ where: { id: { in: itemIds } }, include: { options: true } });

  requirePopulation('check:n-option-precondition', {
    [`options tagged ${TAG}`]: carriers.length,
    'distinct items carrying it': items.length,
  });

  const failures = items.filter((i) => !hasNOption(i.options));
  console.log(`  ${items.length - failures.length} of ${items.length} carrier item(s) offer an N option.`);

  if (failures.length > 0) {
    console.error(`\nN-OPTION PRECONDITION FAILED on ${failures.length} item(s):`);
    for (const i of failures) {
      console.error(`  ✗ ${i.id} carries ${TAG} but offers no N option`);
      console.error(`      options: ${i.options.map((o) => String((o.content as { value?: unknown })?.value)).join(' | ')}`);
    }
    console.error(
      `\n${TAG} describes a child refusing the "no mistake" choice. On an item that never offers\n` +
        'one, the diagnosis cannot be true and the hint coaches against a choice the child never saw.\n' +
        'Retag the distractor, or give the item an N option — do not relax this gate.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Every ${TAG} carrier sits on an item that offers an N option.`);
  await prisma.$disconnect();
}

void main();
