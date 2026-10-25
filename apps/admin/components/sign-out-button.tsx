'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@impactalign/ui';
import { authApi } from '@impactalign/api-client';
export function AdminSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try { await authApi.me(); await authApi.logout(); } catch { /* Still leave the protected console. */ }
    router.replace('/login?reauth=1');
    router.refresh();
  }
  return <Button type="button" variant="outline" size="sm" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</Button>;
}
