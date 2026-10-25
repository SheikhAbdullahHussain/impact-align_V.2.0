'use client';

import { useEffect, useState } from 'react';
import type { PublicUser } from '@impactalign/types';
import { Button } from '@impactalign/ui';
import { ApiError, authApi, describeError } from '@impactalign/api-client';

export function ProfileForm() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    authApi.me().then((session) => {
      if (active) { setUser(session.user); setDisplayName(session.user.displayName); }
    }).catch((cause: unknown) => {
      if (active) setError(describeError(cause));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    const name = displayName.trim();
    if (name.length < 2 || name.length > 80) { setError('Display name must be between 2 and 80 characters.'); return; }
    setSaving(true);
    try {
      const result = await authApi.updateProfile(name);
      setUser(result.user); setDisplayName(result.user.displayName); setMessage('Display name updated.');
    } catch (cause) {
      setError(cause instanceof ApiError && cause.code === 'VALIDATION_ERROR' ? 'Please enter a valid display name.' : describeError(cause));
    } finally { setSaving(false); }
  }

  if (loading) return <p role="status">Loading profile…</p>;
  if (!user) return <p role="alert">{error ?? 'Unable to load your profile.'}</p>;

  return <div className="max-w-2xl space-y-8">
    <header><h1 className="font-serif text-3xl font-bold text-navy-900">Your profile</h1><p className="mt-2 text-navy-800">View your account details and update your display name.</p></header>
    <dl className="grid gap-4 rounded-xl border border-navy-100 bg-white p-5 sm:grid-cols-2">
      <div><dt className="text-sm font-semibold text-navy-700">Name</dt><dd className="mt-1 break-words">{user.displayName}</dd></div>
      <div><dt className="text-sm font-semibold text-navy-700">Email</dt><dd className="mt-1 break-words">{user.email}</dd></div>
      <div><dt className="text-sm font-semibold text-navy-700">Roles</dt><dd className="mt-1">{user.roles.join(', ')}</dd></div>
      <div><dt className="text-sm font-semibold text-navy-700">Email verified</dt><dd className="mt-1">{user.emailVerified ? 'Yes' : 'No'}</dd></div>
    </dl>
    <form onSubmit={save} className="space-y-4 rounded-xl border border-navy-100 bg-white p-5">
      <h2 className="font-serif text-xl font-bold text-navy-900">Edit display name</h2>
      {error && <p role="alert" className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      {message && <p role="status" className="rounded-md border border-teal-700 bg-teal-50 p-3 text-sm text-teal-900">{message}</p>}
      <div className="space-y-1"><label htmlFor="displayName" className="text-sm font-semibold">Display name</label><input id="displayName" name="displayName" maxLength={80} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={saving} className="w-full rounded-md border border-navy-200 bg-white px-3 py-2" /></div>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
    </form>
  </div>;
}
