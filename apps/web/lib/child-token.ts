/**
 * Child-mode scoped token (§4). A child-mode session is a short-lived JWT
 * bound to exactly one child profile. It can read/write only that child's
 * practice data — never billing, settings, other children, or account email.
 * Enforcement lives here at the API layer, not in any UI.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const CHILD_TOKEN_COOKIE = 'crew_token';
/** Child-mode sessions expire after 60 minutes idle (§4). */
export const CHILD_TOKEN_TTL_SECONDS = 60 * 60;

export interface ChildTokenPayload {
  childId: string;
  parentId: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signChildToken(payload: ChildTokenPayload): Promise<string> {
  return new SignJWT({ parentId: payload.parentId, scope: 'child' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.childId)
    .setIssuedAt()
    .setExpirationTime(`${CHILD_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyChildToken(token: string): Promise<ChildTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.scope !== 'child' || typeof payload.sub !== 'string' || typeof payload.parentId !== 'string') {
      return null;
    }
    return { childId: payload.sub, parentId: payload.parentId };
  } catch {
    return null;
  }
}

export type ChildScopeResult =
  | { ok: true; payload: ChildTokenPayload }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Guard for child-scoped API routes. 401 without a valid token; 403 when the
 * token is for a different child (gate checklist #4).
 */
export async function requireChildScope(childId: string): Promise<ChildScopeResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_TOKEN_COOKIE)?.value;
  if (!token) return { ok: false, status: 401, error: 'child_token_required' };
  const payload = await verifyChildToken(token);
  if (!payload) return { ok: false, status: 401, error: 'child_token_invalid' };
  if (payload.childId !== childId) return { ok: false, status: 403, error: 'child_scope_mismatch' };
  return { ok: true, payload };
}
