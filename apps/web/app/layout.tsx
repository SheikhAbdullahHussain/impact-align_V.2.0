import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | Dashboard' },
  robots: { index: false, follow: false, nocache: true },
};

/** Every dashboard page requires a session that the API confirms; otherwise: sign in first. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');
  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
