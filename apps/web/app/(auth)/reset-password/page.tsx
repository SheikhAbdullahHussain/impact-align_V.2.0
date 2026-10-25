import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Set new password',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthCard
      title="Set a new password"
      footer={{ text: 'Need a new link?', linkLabel: 'Request one', href: '/forgot-password' }}
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p role="alert">
          This link is incomplete. Open the link from your email again, or request a new one.
        </p>
      )}
    </AuthCard>
  );
}
