'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@impactalign/ui';
import { authApi, describeError } from '@/lib/api/client';
import { FormMessage } from './form-message';

/** Verification needs an explicit click (not on page load) so link-preview bots cannot use up the token. */
export function VerifyEmailForm({ token }: { readonly token: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'done'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setState('working');
    setError(null);
    try {
      setMessage((await authApi.verifyEmail(token)).message);
      setState('done');
    } catch (err) {
      setError(describeError(err));
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="space-y-4">
        <FormMessage kind="success">{message}</FormMessage>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={state === 'working'}
        onClick={verify}
      >
        {state === 'working' ? 'Verifying…' : 'Verify my email'}
      </Button>
    </div>
  );
}
