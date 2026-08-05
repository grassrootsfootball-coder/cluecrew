/**
 * Server-enforced admin role boundary (Phase 2 §5, David's ruling
 * 2026-08-01): a REVIEWER's world is the review surfaces — the misconception
 * queue, item review, the Word list, the NVR sample sheets and the sitting
 * materials — plus the admin landing page. Everything else under /admin
 * answers 403 at the edge, before any page code runs: refused, not merely
 * hidden. The nav ALSO hides them (2026-08-02) so a reviewer is never invited
 * through a door this closes — but hiding is courtesy; this is the gate.
 *
 * The role rides the session JWT (set at sign-in), read here without any
 * database call — so role changes apply from the next sign-in, a trade
 * recorded deliberately. The per-action role guards in lib/actions remain
 * as the second, DB-backed layer.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { REVIEWER_ALLOWED_PREFIXES } from '@/lib/admin-nav';

// The allowlist lives in lib/admin-nav.ts, shared with the nav that renders
// these links, so a reviewer is never offered a door this refuses to open.
const REVIEWER_ALLOWED = REVIEWER_ALLOWED_PREFIXES;

/**
 * Prelaunch gate (production promotion, 2026-08-01): with PRELAUNCH=on the
 * public marketing and founding routes render a plain holding page and
 * /signup is off — while /login, Parent HQ, the crew app and /admin remain
 * fully functional. The app's own auth is the production gate.
 */
const PRELAUNCH_HELD = [
  /^\/$/,
  /^\/pricing$/,
  /^\/founding(\/|$)/,
  /^\/bursary$/,
  /^\/schools$/,
  /^\/11-plus(\/|$)/,
  /^\/how-we-teach$/,
  /^\/casebook-sample$/,
  /^\/faq$/,
  /^\/safeguarding$/,
  /^\/accessibility$/,
  /^\/signup$/,
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.PRELAUNCH === 'on' && PRELAUNCH_HELD.some((route) => route.test(pathname))) {
    return NextResponse.rewrite(new URL('/holding', request.url));
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    // next-auth v5 cookie naming; secureCookie must match the deployment.
    secureCookie: process.env.NODE_ENV === 'production',
  });
  const role = (token as { staffRole?: string } | null)?.staffRole;

  if (role !== 'REVIEWER') return NextResponse.next();

  if (pathname === '/admin' || REVIEWER_ALLOWED.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  return new NextResponse('Forbidden: this area is outside the reviewer role.', { status: 403 });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/',
    '/pricing',
    '/founding/:path*',
    '/founding',
    '/bursary',
    '/schools',
    '/11-plus/:path*',
    '/how-we-teach',
    '/casebook-sample',
    '/faq',
    '/safeguarding',
    '/accessibility',
    '/signup',
  ],
};
