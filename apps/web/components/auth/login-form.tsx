'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@impactalign/ui';
import { loginSchema } from '@impactalign/validation';
import { authApi, describeError } from '@/lib/api/client';
import { fieldErrors } from '@/lib/auth/form-errors';
import { safeNextPath } from '@/lib/auth/next-path';
import { FormMessage } from './form-message';
import { TextField } from './text-field';

export function LoginForm({ next }: { readonly next?: string | undefined }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.login(parsed.data.email, parsed.data.password);
      router.replace(safeNextPath(next));
      router.refresh();
    } catch (error) {
      setFormError(describeError(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={submitting}>
      {formError && <FormMessage kind="error">{formError}</FormMessage>}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={errors['email']}
        disabled={submitting}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={errors['password']}
        disabled={submitting}
      />
      <p className="text-sm">
        <Link
          href="/forgot-password"
          className="font-semibold text-navy-900 underline underline-offset-4"
        >
          Forgot your password?
        </Link>
      </p>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
