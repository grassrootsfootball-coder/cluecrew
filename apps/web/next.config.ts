import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

// All packages read the single root .env (documented in README).
loadEnv({ path: resolve(process.cwd(), '../../.env') });

const isDev = process.env.NODE_ENV !== 'production';

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
