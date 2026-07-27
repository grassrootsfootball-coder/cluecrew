import type { Metadata } from 'next';
import { cssVariables } from '@cluecrew/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClueCrew',
  description: 'ClueCrew makes the 11+ make sense — clear teaching, calm design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <style>{`:root{${cssVariables()}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
