import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieString = vi.fn();
vi.mock('next/headers', () => ({ cookies: async () => ({ toString: cookieString }) }));

import { getSession } from './session';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  cookieString.mockReturnValue('ia_session=abc123');
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('getSession (server-side)', () => {
  it('returns null without calling the API when there is no cookie', async () => {
    cookieString.mockReturnValue('');
    expect(await getSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards the cookies to the API and returns the signed-in user', async () => {
    const body = { user: { id: '1', displayName: 'Ada' }, csrfToken: 'c' };
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
    expect(await getSession()).toEqual(body);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://localhost:4000/api/v1/auth/me');
    expect(init.headers.cookie).toBe('ia_session=abc123');
    expect(init.cache).toBe('no-store');
  });

  it('treats a rejected session as signed out', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) });
    expect(await getSession()).toBeNull();
  });

  it('fails closed (null, no throw) when the API is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(getSession()).resolves.toBeNull();
  });
});
