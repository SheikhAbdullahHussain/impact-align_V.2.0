'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@impactalign/ui';
import { loginSchema } from '@impactalign/validation';
import { authApi, describeError } from '@impactalign/api-client';

export function AdminLoginForm({ reauth, reason }: { reauth: boolean; reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(reason === 'staff' ? 'This account does not have admin access. You have been signed out. Sign in with an administrator account.' : null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Enter a valid email address and password.');
      return;
    }
    setBusy(true);
    try {
      await authApi.login(parsed.data.email, parsed.data.password);
      // The protected console rechecks /auth/me server-side and logs non-staff sessions out.
      router.replace('/console');
      router.refresh();
    } catch (cause) {
      setError(describeError(cause));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={busy}>
      {reauth && !error && <p role="status" className="rounded-md border border-navy-200 p-3 text-sm">Please sign in again.</p>}
      {error && <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      <div className="space-y-1"><label htmlFor="email" className="text-sm font-semibold">Email</label><input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className="w-full rounded-md border border-navy-200 bg-white px-3 py-2" /></div>
      <div className="space-y-1"><label htmlFor="password" className="text-sm font-semibold">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} className="w-full rounded-md border border-navy-200 bg-white px-3 py-2" /></div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  );
}
