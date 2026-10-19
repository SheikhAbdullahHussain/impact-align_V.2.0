import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';

export const metadata: Metadata = {
  title: 'Verify email',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthCard title="Verify your email" description="Confirm that this address belongs to you.">
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <p role="alert">This link is incomplete. Open the link from your email again.</p>
      )}
    </AuthCard>
  );
}
