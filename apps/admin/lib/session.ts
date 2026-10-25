import { cookies } from 'next/headers';
import type { AuthResponse } from '@impactalign/types';

const apiUrl = () => (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

export function hasAdminAccess(session: AuthResponse): boolean {
  return session.user.roles.some((role) => ADMIN_ROLES.has(role));
}

/** Validate the browser's session on the server using the API's authoritative /me endpoint. */
export async function getAdminSession(): Promise<AuthResponse | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;
  try {
    const response = await fetch(`${apiUrl()}/api/v1/auth/me`, {
      headers: { cookie: cookieHeader, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok ? ((await response.json()) as AuthResponse) : null;
  } catch {
    return null;
  }
}

/** Invalidate a valid non-staff session before sending the browser back to login. */
export async function logoutCurrentSession(session: AuthResponse): Promise<void> {
  const cookieHeader = (await cookies()).toString();
  try {
    await fetch(`${apiUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': session.csrfToken,
      },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(4_000),
    });
  } catch {
    // Fail closed: the protected console is still never rendered for non-staff users.
  }
}
