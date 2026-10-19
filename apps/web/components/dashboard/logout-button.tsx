'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@impactalign/ui';
import { authApi } from '@/lib/api/client';

export function LogoutButton() {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function logout() {
    setWorking(true);
    try {
      await authApi.me(); // after a page load the CSRF token is gone from memory; fetch it again
      await authApi.logout();
    } catch {
      // Already signed out, or the server is unreachable: either way, leave the dashboard.
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={logout} disabled={working}>
      {working ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
