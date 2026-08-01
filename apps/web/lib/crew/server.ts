import { cookies } from 'next/headers';
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
/**
 * AMENDMENT-1 (D7): the child app door is ALWAYS open. Crew — the absence of
 * a live subscription — is a real tier with real content, so there is no
 * billing state a child can perceive: no lock-out screen, no quiet-HQ page,
 * nothing. What differs by tier is which cases are open, and a closed case
 * looks exactly like an unbuilt district door.
 */
export async function childHasAccess(_child: ChildProfile): Promise<boolean> {
  return true;
}

export function childSettings(child: ChildProfile): ChildSettings {
  return (child.settings ?? {}) as ChildSettings;
}
