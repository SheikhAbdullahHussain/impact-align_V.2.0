import { cookies } from 'next/headers';
import type { AuthResponse } from '@impactalign/types';

/** Where the Express API lives (server-side only). Same value the /api/v1 rewrite uses. */
const apiUrl = () => (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/**
 * The signed-in user for this request, or null. Runs on the server: it forwards the browser's cookies
 * to the API, which is the only place that decides whether a session is valid. Never throws, so an
 * unreachable API simply means "not signed in" (fail closed).
 */
export async function getSession(): Promise<AuthResponse | null> {
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
