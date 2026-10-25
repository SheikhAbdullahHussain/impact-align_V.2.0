import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, authApi, describeError, setCsrfToken } from '../api/client';
import { fieldErrors } from './form-errors';
import { safeNextPath } from './next-path';

describe('safeNextPath (open-redirect protection)', () => {
  it('allows same-site paths, including query strings', () => {
    expect(safeNextPath('/dashboard/projects')).toBe('/dashboard/projects');
    expect(safeNextPath('/accreditation?x=1')).toBe('/accreditation?x=1');
  });
  it.each([
    undefined,
    null,
    '',
    'dashboard',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/ok\nbad',
  ])('falls back for %s', (value) => {
    expect(safeNextPath(value as string | undefined)).toBe('/dashboard');
  });
});

describe('fieldErrors', () => {
  it('keeps the first message per field', () => {
    expect(
      fieldErrors([
        { path: ['email'], message: 'bad email' },
        { path: ['email'], message: 'second' },
        { path: ['password'], message: 'short' },
      ]),
    ).toEqual({ email: 'bad email', password: 'short' });
  });
});

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  setCsrfToken(null);
});

describe('apiFetch', () => {
  it('calls the same-origin /api/v1 proxy with JSON and cookies, and no CSRF header before login', async () => {
    const fetchMock = respond(202, { message: 'ok' });
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/auth/register', { method: 'POST', body: { a: 1 } });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/v1/auth/register');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('sends the CSRF token on state-changing requests only, after login', async () => {
    vi.stubGlobal('fetch', respond(200, { user: {}, csrfToken: 'csrf-123' }));
    await authApi.login('a@example.org', 'pw');
    const fetchMock = respond(204);
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/auth/logout', { method: 'POST', body: {} });
    await apiFetch('/auth/me');
    expect(fetchMock.mock.calls[0]![1].headers['X-CSRF-Token']).toBe('csrf-123');
    expect(fetchMock.mock.calls[1]![1].headers['X-CSRF-Token']).toBeUndefined();
  });

  it('turns API error envelopes into ApiError and network failures into status 0', async () => {
    vi.stubGlobal(
      'fetch',
      respond(401, {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          requestId: 'r',
        },
      }),
    );
    await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(apiFetch('/auth/me')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});

describe('describeError', () => {
  it('shows friendly text and never raw server errors', () => {
    expect(describeError(new ApiError(429, 'TOO_MANY_ATTEMPTS', 'x'))).toMatch(/too many/i);
    expect(describeError(new ApiError(403, 'EMAIL_NOT_VERIFIED', 'x'))).toMatch(
      /verify your email/i,
    );
    expect(describeError(new ApiError(400, 'INVALID_OR_EXPIRED_TOKEN', 'x'))).toMatch(/expired/i);
    expect(describeError(new Error('Unexpected token < in JSON at position 0'))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
