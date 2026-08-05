/**
 * The approved KS2 maths misconception seed set, built in one place so the
 * export and the freshness checker hash the same thing. Each entry carries the
 * reviewer's category and David's derivable/conceptual class (a derivable one
 * executes on an item's numbers to yield a specific wrong answer; a conceptual
 * one relies on authoring and review).
 */
import type { PrismaClient } from '@prisma/client';

const CONCEPTUAL = new Set([15, 20, 27, 28, 30, 40, 41, 42, 43, 49, 50, 58, 59]);

export async function buildMathsMisconceptionsSource(prisma: PrismaClient): Promise<unknown[]> {
  const rows = await prisma.misconception.findMany({
    where: { district: 'MATHS', status: 'ACTIVE' },
    orderBy: { id: 'asc' },
    select: { id: true, category: true, description: true, childHint: true, sourcePattern: true },
  });
  return rows.map((m) => {
    const n = Number(/#(\d+)$/.exec(m.sourcePattern ?? '')?.[1] ?? 0);
    return {
      id: m.id,
      category: m.category,
      distractorClass: CONCEPTUAL.has(n) ? 'conceptual' : 'derivable',
      description: m.description,
      childHint: m.childHint,
    };
  });
}
