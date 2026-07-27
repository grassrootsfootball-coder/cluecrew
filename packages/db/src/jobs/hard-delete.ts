/**
 * Retention job (§5): accounts soft-deleted more than 30 days ago are
 * hard-deleted, together with every family row and their analytics events.
 * Child data cascades from ParentAccount; Event rows have no FK by design,
 * so they are removed explicitly here first.
 *
 * Runs from CLI (`pnpm jobs:hard-delete`) or a scheduled runner later.
 */
import { prisma } from '../index';

export const HARD_DELETE_AFTER_DAYS = 30;

export async function runHardDelete(now = new Date()): Promise<{ parents: number; events: number }> {
  const cutoff = new Date(now.getTime() - HARD_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const parents = await prisma.parentAccount.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    select: { id: true, children: { select: { id: true } } },
  });

  let eventsDeleted = 0;
  for (const parent of parents) {
    const childIds = parent.children.map((c) => c.id);
    const events = await prisma.event.deleteMany({
      where: {
        OR: [
          { parentId: parent.id },
          ...(childIds.length > 0 ? [{ childId: { in: childIds } }] : []),
        ],
      },
    });
    eventsDeleted += events.count;
    // Cascade removes children, consent, subscription, tokens, case files,
    // attempts, sessions, review schedules, and word-vault entries.
    await prisma.parentAccount.delete({ where: { id: parent.id } });
  }

  return { parents: parents.length, events: eventsDeleted };
}

const isDirectRun = process.argv[1]?.endsWith('hard-delete.ts');
if (isDirectRun) {
  runHardDelete()
    .then(({ parents, events }) => {
      console.log(`Hard-delete complete: ${parents} account(s), ${events} event row(s) removed.`);
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
