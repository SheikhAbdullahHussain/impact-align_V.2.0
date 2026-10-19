import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/auth/session';
import { safeNextPath } from '@/lib/auth/next-path';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSession()) redirect(safeNextPath(next)); // already signed in
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to ImpactAlign SDG."
      footer={{ text: 'New here?', linkLabel: 'Create an account', href: '/register' }}
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
