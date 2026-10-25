import { redirect } from 'next/navigation';
import { Container } from '@impactalign/ui';
import { AdminLoginForm } from '@/components/login-form';
import { getAdminSession, hasAdminAccess } from '@/lib/session';

export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false, nocache: true } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ reauth?: string; reason?: string }> }) {
  const params = await searchParams;
  if (params.reauth !== '1') {
    const session = await getAdminSession();
    if (session && hasAdminAccess(session)) redirect('/console');
  }
  return <Container className="max-w-md py-16">
    <h1 className="font-serif text-3xl font-bold text-navy-900">Admin sign in</h1>
    <p className="mt-2 text-sm text-navy-800">Sign in with your ImpactAlign staff account.</p>
    <AdminLoginForm reauth={params.reauth === '1'} reason={params.reason} />
  </Container>;
}
