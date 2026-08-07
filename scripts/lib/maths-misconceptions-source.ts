/**
 * The approved KS2 maths misconception seed set, built in one place so the
 * export and the freshness checker hash the same thing. Each entry carries the
 * reviewer's category, David's derivable/conceptual class (a derivable one
 * executes on an item's numbers to yield a specific wrong answer; a conceptual
 * one relies on authoring and review), and its AXIS on annie's two-tag model —
 * a TOPIC id names WHAT the child got wrong; a PROCESS id names a stop/order/
 * operation slip that is not a topic and must be paired with a topic id. Without
 * the axis in the export, a drafter cannot tell the process ids apart or apply
 * the pairing rule (batches 04-05, 2026-08-07: PROC-01 reached for but mis-shaped).
 */
import type { PrismaClient } from '@prisma/client';

const CONCEPTUAL = new Set([15, 20, 27, 28, 30, 31, 40, 41, 42, 43, 49, 50, 58, 59, 101]);

export async function buildMathsMisconceptionsSource(prisma: PrismaClient): Promise<unknown[]> {
  const rows = await prisma.misconception.findMany({
    where: { district: 'MATHS', status: 'ACTIVE' },
    select: { id: true, category: true, description: true, childHint: true, sourcePattern: true, status: true, axis: true },
  });
  const entryNum = (sp?: string | null): number => Number(/#(\d+)\b/.exec(sp ?? '')?.[1] ?? 0);
  return rows
    .map((m) => {
      const n = entryNum(m.sourcePattern);
      return {
        entry: n,
        id: m.id,
        category: m.category,
        status: m.status,
        // TOPIC is the default axis; only the reclassified process slips carry PROCESS.
        axis: m.axis === 'PROCESS' ? 'PROCESS' : 'TOPIC',
        distractorClass: CONCEPTUAL.has(n) ? 'conceptual' : 'derivable',
        description: m.description,
        childHint: m.childHint,
      };
    })
    .sort((a, b) => a.entry - b.entry);
}
