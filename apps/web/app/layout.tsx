import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { siteConfig } from '@impactalign/config';
import { siteUrl } from '@/lib/site-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: { card: 'summary', title: siteConfig.name, description: siteConfig.description },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f2040' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading request headers opts the tree into dynamic rendering, which the per-request CSP nonce requires.
  await headers();
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
