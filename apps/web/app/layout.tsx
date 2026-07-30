import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { cssVariables } from '@cluecrew/ui';
import './globals.css';

/**
 * Lexend (SIL Open Font License 1.1), the crew's reading face.
 *
 * Self-hosted deliberately: /crew sends `default-src 'self'` with no external
 * origin anywhere in the policy, and an e2e test asserts that, so a font from
 * a CDN would simply not load for the children who need it most. next/font
 * serves it from our own origin and preloads it.
 *
 * One variable file covers every weight — 39KB for the latin subset, against
 * a whole typeface — and `display: swap` means text is readable from the first
 * paint rather than invisible while the font arrives. The system stack stays
 * behind it as the fallback.
 */
const lexend = localFont({
  src: '../node_modules/@fontsource-variable/lexend/files/lexend-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--cc-font',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'ClueCrew',
  description: 'ClueCrew makes the 11+ make sense — clear teaching, calm design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={lexend.variable}>
      <head>
        <style>{`:root{${cssVariables()}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
