'use client';

import { useState } from 'react';
import { Button } from '@impactalign/ui';
import { SELF_REGISTRATION_ROLES } from '@impactalign/types';
import { registerSchema } from '@impactalign/validation';
import { authApi, describeError } from '@/lib/api/client';
import { fieldErrors } from '@/lib/auth/form-errors';
import { FormMessage } from './form-message';
import { TextField } from './text-field';

const ACCOUNT_LABELS: Record<(typeof SELF_REGISTRATION_ROLES)[number], string> = {
  PROFESSIONAL: 'Professional',
  RESEARCHER: 'Researcher',
  ACADEMIC: 'Academic',
  PARTNER: 'Partner',
  PUBLIC_USER: 'Public user',
};

export function RegisterForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<string>('PUBLIC_USER');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = registerSchema.safeParse({ email, password, displayName, accountType });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await authApi.register(parsed.data);
      setDone(result.message);
    } catch (error) {
      setFormError(describeError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <FormMessage kind="success">{done}</FormMessage>
        <p className="text-sm text-navy-800">
          Open the email we sent and select the verification link. The link works once and expires
          after 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={submitting}>
      {formError && <FormMessage kind="error">{formError}</FormMessage>}
      <TextField
        label="Full name"
        name="displayName"
        autoComplete="name"
        value={displayName}
        onChange={setDisplayName}
        error={errors['displayName']}
        disabled={submitting}
      />
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
        autoComplete="new-password"
        hint="At least 12 characters. A few random words make a strong, memorable password."
        value={password}
        onChange={setPassword}
        error={errors['password']}
        disabled={submitting}
      />
      <div>
        <label htmlFor="accountType" className="block text-sm font-semibold text-navy-900">
          I am joining as
        </label>
        <select
          id="accountType"
          name="accountType"
          value={accountType}
          disabled={submitting}
          onChange={(event) => setAccountType(event.target.value)}
          className="mt-1 block h-11 w-full rounded-md border border-navy-300 bg-white px-3 text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          {SELF_REGISTRATION_ROLES.map((role) => (
            <option key={role} value={role}>
              {ACCOUNT_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
