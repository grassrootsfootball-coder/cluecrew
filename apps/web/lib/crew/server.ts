import { cookies } from 'next/headers';
import { hasActiveAccess } from '@cluecrew/core';
import { prisma, type ChildProfile } from '@cluecrew/db';
import { CHILD_TOKEN_COOKIE, verifyChildToken } from '@/lib/child-token';

export interface ChildSettings {
  reducedMotion?: boolean;
  dyslexiaFont?: boolean;
  audioDefault?: boolean;
  /** Parent default-off option for sound effects (§3). */
  soundEnabled?: boolean;
  sessionMinutes?: number;
}

/** The child behind the current crew_token cookie, or null. */
export async function childFromCookie(): Promise<ChildProfile | null> {
  const token = (await cookies()).get(CHILD_TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyChildToken(token);
  if (!payload) return null;
  const child = await prisma.childProfile.findUnique({ where: { id: payload.childId } });
  if (!child || child.deletedAt) return null;
  return child;
}

/**
 * Access check for the child app. When access is paused the child sees a
 * warm, generic "ask your grown-up" — NEVER any sign of payment state (§2).
 */
export async function childHasAccess(child: ChildProfile): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({ where: { parentId: child.parentId } });
  if (!subscription) return process.env.APP_ENV !== 'production';
  return hasActiveAccess(
    subscription.status as 'trialing' | 'active' | 'past_due' | 'canceled',
    subscription.trialEndsAt,
    new Date(),
  );
}

export function childSettings(child: ChildProfile): ChildSettings {
  return (child.settings ?? {}) as ChildSettings;
}
