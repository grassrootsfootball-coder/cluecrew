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

/**
 * IS THIS REQUEST SECURE — asked of the REQUEST, never of NODE_ENV (2026-08-09).
 *
 * The `Secure` flag has to match the scheme the cookie actually travels over. Deriving it from
 * NODE_ENV gets that wrong in both directions: a production build served over http sets `Secure`
 * on a cookie the browser then refuses to store, and the middleware reading it looks for a
 * `__Secure-` name that was never written. Both halves of the child session were keyed off the
 * environment, so they agreed with each other and were wrong together — which is why nothing
 * caught it until the suite finally ran in a production build.
 *
 * `x-forwarded-proto` first, so a TLS-terminating proxy still reports https to the app.
 */
export function isSecureRequest(
  headers: { get(name: string): string | null },
  /** The request's own scheme, where the caller has it (a Route Handler does; a Server Action does not). */
  protocol?: string,
): boolean {
  const forwarded = headers.get('x-forwarded-proto');
  if (forwarded) return forwarded.split(',')[0]!.trim() === 'https';
  if (protocol) return protocol.replace(':', '') === 'https';
  // Last resort, and deliberately the narrowest branch left: no proxy header and no scheme to
  // read. Treated as insecure, which fails SAFE — a cookie without `Secure` still works over
  // https; a cookie WITH it silently vanishes over http, which is the failure that hid for months.
  return false;
}

/** The one definition of the child cookie's options, so the two writers cannot drift apart. */
export function childCookieOptions(secure: boolean) {
  return { httpOnly: true, sameSite: 'lax' as const, secure, path: '/', maxAge: CHILD_TOKEN_TTL_SECONDS };
}

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
