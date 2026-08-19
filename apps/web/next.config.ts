import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

// All packages read the single root .env (documented in README).
loadEnv({ path: resolve(process.cwd(), '../../.env') });

const isDev = process.env.NODE_ENV !== 'production';

/**
 * APP_ENV REACHES THE CLIENT BUNDLE (2026-08-09).
 *
 * The two engine debug harnesses gate themselves on `NEXT_PUBLIC_APP_ENV !== 'staging'` in a
 * production build. That variable was READ IN TWO PLACES AND SET NOWHERE, so the harnesses could
 * never render in any production build — and the eight e2e tests that drive them could never pass
 * in CI, which builds before it runs them. They had been failing since the harnesses were written.
 *
 * `APP_ENV` is the single env this repo already uses (dev | staging | production), so the public
 * mirror is derived from it rather than being a second thing to remember to set.
 */
const appEnv = process.env.APP_ENV ?? 'dev';

/**
 * CSP for child-facing /crew routes (S1, BUILD-PHASE-1 §5): no third-party
 * scripts, styles, images, fonts, or connections — every source is 'self'.
 * CI asserts this header and that an injected third-party script is blocked.
 */
const crewCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Geolocation is never collected (§5) — deny it at the platform level too.
  { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=(), payment=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

const nextConfig: NextConfig = {
  /**
   * THE FLOATING "N" IN ANNIE'S TI-05 STILLS (R209). Next.js's dev-tools button — framework
   * furniture that exists only under `next dev`, rendered into a shadow-DOM portal. Not a product
   * control: it records nothing, no child can ever meet it (production builds never mount it), and
   * comprehension has no N option — the resemblance to the error-spot verdict pill was a
   * coincidence of typography. Off, because review stills are read as the child's surface and a
   * reviewer should never have to ask which parts of a screenshot are real.
   */
  devIndicators: false,
  // Inlined at build time, so the harness gate can read it in the browser bundle.
  env: { NEXT_PUBLIC_APP_ENV: appEnv },
  transpilePackages: ['@cluecrew/core', '@cluecrew/db', '@cluecrew/ui'],
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/crew', headers: [{ key: 'Content-Security-Policy', value: crewCsp }] },
      { source: '/crew/:path*', headers: [{ key: 'Content-Security-Policy', value: crewCsp }] },
    ];
  },
};

export default nextConfig;
