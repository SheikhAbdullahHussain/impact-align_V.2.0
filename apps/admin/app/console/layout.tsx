import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Container } from '@impactalign/ui';
import { getAdminSession, hasAdminAccess, logoutCurrentSession } from '@/lib/session';
import { AdminSignOutButton } from '@/components/sign-out-button';

export const metadata: Metadata = { title: { default: 'Console', template: '%s | ImpactAlign Admin' }, robots: { index: false, follow: false, nocache: true } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/login?reauth=1');
  if (!hasAdminAccess(session)) {
    await logoutCurrentSession(session);
    redirect('/login?reauth=1&reason=staff');
  }
  return <div className="min-h-dvh bg-navy-50">
    <header className="border-b border-navy-100 bg-white"><Container className="flex items-center justify-between py-4"><Link href="/console" className="font-serif text-xl font-bold text-navy-900">ImpactAlign Admin</Link><div className="flex items-center gap-4"><span className="hidden text-sm sm:inline">{session.user.displayName}</span><AdminSignOutButton /></div></Container></header>
    <Container className="py-10">{children}</Container>
  </div>;
}
