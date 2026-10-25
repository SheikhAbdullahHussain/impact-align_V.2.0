'use client';

import { useState } from 'react';
import { Button } from '@impactalign/ui';
import { forgotPasswordSchema } from '@impactalign/validation';
import { authApi, describeError } from '@/lib/api/client';
import { fieldErrors } from '@/lib/auth/form-errors';
import { FormMessage } from './form-message';
import { TextField } from './text-field';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      setDone((await authApi.forgotPassword(parsed.data.email)).message);
    } catch (error) {
      setFormError(describeError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <FormMessage kind="success">{done}</FormMessage>;

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
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
