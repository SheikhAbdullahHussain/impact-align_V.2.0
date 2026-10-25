import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ImpactAlign SDG',
    template: '%s | ImpactAlign SDG',
  },
  description: 'Align, measure, validate, and improve your sustainable development impact.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
