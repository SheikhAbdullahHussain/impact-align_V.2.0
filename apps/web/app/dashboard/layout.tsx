import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { isDashboardPreviewEnabled } from '@/lib/dashboard-gate';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | Dashboard' },
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No authentication exists yet: hide the preview in production unless explicitly enabled.
  if (!isDashboardPreviewEnabled(process.env)) notFound();
  return <DashboardShell>{children}</DashboardShell>;
}
