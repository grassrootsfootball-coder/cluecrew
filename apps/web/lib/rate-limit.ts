/**
 * Sliding-window rate limiter for auth endpoints (§4).
 * In-memory and therefore per-instance — adequate for Phase 1 single-region
 * deployment; swap the store for a shared one (e.g. Postgres or Redis) before
 * horizontal scaling. The account-level lockout in login is DB-backed and
 * instance-independent already.
 */
const windows = new Map<string, number[]>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= maxRequests) {
    windows.set(key, hits);
    return false;
  }
  hits.push(now);
  windows.set(key, hits);
  return true;
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'local';
  return `${scope}:${ip}`;
}
