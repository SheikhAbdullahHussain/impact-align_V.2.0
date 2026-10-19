'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@impactalign/ui';
import { resetPasswordSchema } from '@impactalign/validation';
import { authApi, describeError } from '@/lib/api/client';
import { fieldErrors } from '@/lib/auth/form-errors';
import { FormMessage } from './form-message';
import { TextField } from './text-field';

export function ResetPasswordForm({ token }: { readonly token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ token, password });
    const next = parsed.success ? {} : fieldErrors(parsed.error.issues);
    if (password !== confirm) next['confirm'] = 'The passwords do not match';
    if (!parsed.success || Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      setDone((await authApi.resetPassword(token, parsed.data.password)).message);
    } catch (error) {
      setFormError(describeError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <FormMessage kind="success">{done}</FormMessage>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={submitting}>
      {formError && <FormMessage kind="error">{formError}</FormMessage>}
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 12 characters."
        value={password}
        onChange={setPassword}
        error={errors['password']}
        disabled={submitting}
      />
      <TextField
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        error={errors['confirm']}
        disabled={submitting}
      />
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  );
}
