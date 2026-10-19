import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send you a link if an account exists."
      footer={{ text: 'Remembered it?', linkLabel: 'Back to sign in', href: '/login' }}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
