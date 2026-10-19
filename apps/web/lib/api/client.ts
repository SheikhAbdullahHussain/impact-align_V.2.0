import type { ApiErrorBody, ApiErrorDetail, AuthResponse } from '@impactalign/types';

/** Error returned by the API (or a network failure, status 0). Messages are safe to show to users. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Kept in memory only (never localStorage): sent as X-CSRF-Token on state-changing requests. */
let csrfToken: string | null = null;
export const setCsrfToken = (token: string | null): void => {
  csrfToken = token;
};

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = init.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (UNSAFE_METHODS.has(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;

  let response: Response;
  try {
    // Same-origin: Next.js proxies /api/v1/* to the API, so the session cookie stays first-party.
    response = await fetch(`/api/v1${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach the server. Check your connection and try again.',
    );
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Something went wrong',
      error?.details,
    );
  }
  return data as T;
}

export interface RegisterBody {
  email: string;
  password: string;
  displayName: string;
  accountType: string;
}

export const authApi = {
  register: (body: RegisterBody) =>
    apiFetch<{ message: string }>('/auth/register', { method: 'POST', body }),
  verifyEmail: (token: string) =>
    apiFetch<{ message: string }>('/auth/verify-email', { method: 'POST', body: { token } }),
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setCsrfToken(result.csrfToken);
    return result;
  },
  async me(): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/me');
    setCsrfToken(result.csrfToken);
    return result;
  },
  async logout(): Promise<void> {
    await apiFetch<void>('/auth/logout', { method: 'POST', body: {} });
    setCsrfToken(null);
  },
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),
};

/** Turns any error into a friendly sentence. Never shows raw server details. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Please verify your email first. Check your inbox for the verification link.';
    case 'TOO_MANY_ATTEMPTS':
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'INVALID_OR_EXPIRED_TOKEN':
      return 'This link is invalid or has expired. Please request a new one.';
    case 'VALIDATION_ERROR':
      return 'Please check the highlighted fields and try again.';
    default:
      return error.message;
  }
}
