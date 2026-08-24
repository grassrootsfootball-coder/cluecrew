/**
 * A CASE WITH AN EMPTY LIVE POOL DOES NOT EXIST FOR A CHILD (David, 2026-08-24 — R695).
 *
 * Eleven PAID VR cases stood on zero live pools; each rendered, opened, and immediately ended the
 * session — a door that opens onto an ending, sitting at order 2 of the default path. The rule:
 * a case whose live pool is empty does not render in the district map, is not selectable as a
 * focus case, and cannot consume a session. **DERIVED FROM THE POOL AT REQUEST TIME, never a
 * flag anyone sets** — the case reappears the moment its pool has a LIVE item, with no one
 * remembering to unhide it.
 *
 * Rides the D7 principle: a hidden case is INDISTINGUISHABLE from unbuilt content — the district
 * map's quiet-chip path and the case page's notFound, the same doors a tier lock uses.
 *
 * The pool definition matches the serving one: LIVE + PRACTICE over the case's primary AND
 * mapped question types, minus the serving holds — the same facts `itemPool` serves from.
 */
import { isHeldFromServing } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';

export async function servableCaseIds(): Promise<Set<string>> {
  const [cases, liveItems] = await Promise.all([
    prisma.case.findMany({ select: { id: true, questionTypeId: true, mappedQuestionTypeIds: true } }),
    prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' }, select: { id: true, questionTypeId: true } }),
  ]);
  const liveByType = new Map<string, number>();
  for (const item of liveItems) {
    if (isHeldFromServing(item.id)) continue;
    liveByType.set(item.questionTypeId, (liveByType.get(item.questionTypeId) ?? 0) + 1);
  }
  return new Set(
    cases
      .filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (liveByType.get(t) ?? 0) > 0))
      .map((c) => c.id),
  );
}
