/**
 * Entitlement reads (AMENDMENT-1 §5.1). The mapping itself is core; this is
 * the door every API route uses. NOTHING in the child app may branch on any
 * of this in a way a child could read as money (D7) — a Crew child's locked
 * case renders exactly like an unbuilt district door.
 */
import { entitlementsFor, type Entitlements } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';

export async function entitlementsForParent(parentId: string): Promise<Entitlements> {
  const subscription = await prisma.subscription.findUnique({ where: { parentId } });
  return entitlementsFor(
    subscription
      ? {
          tier: subscription.tier,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
        }
      : null,
  );
}

export async function entitlementsForChild(childId: string): Promise<Entitlements> {
  const child = await prisma.childProfile.findUniqueOrThrow({
    where: { id: childId },
    select: { parentId: true },
  });
  return entitlementsForParent(child.parentId);
}

/** The case ids open to this child — all of them, or the free-tier set. */
export async function openCaseIds(childId: string): Promise<Set<string> | 'all'> {
  const entitlements = await entitlementsForChild(childId);
  if (entitlements.allCases) return 'all';
  const freeCases = await prisma.case.findMany({
    where: { freeTier: true },
    select: { id: true },
  });
  return new Set(freeCases.map((row) => row.id));
}
