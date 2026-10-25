import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create account',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard
      title="Create your account"
      description="Join ImpactAlign SDG. We will email you a link to verify your address."
      footer={{ text: 'Already have an account?', linkLabel: 'Sign in', href: '/login' }}
    >
      <RegisterForm />
    </AuthCard>
  );
}
