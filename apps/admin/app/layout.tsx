import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { SkipLink } from '@impactalign/ui';
import { siteUrl } from '@/lib/site-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'ImpactAlign Admin', template: '%s | ImpactAlign Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Dynamic rendering is required for the per-request CSP nonce.
  await headers();
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <SkipLink />
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
      </body>
    </html>
  );
}
