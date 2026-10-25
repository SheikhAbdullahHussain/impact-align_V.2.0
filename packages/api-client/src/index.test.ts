
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, setCsrfToken } from './index';

describe('shared API client', () => {
  afterEach(() => {
    setCsrfToken(null);
    vi.unstubAllGlobals();
  });

  it('sends the in-memory CSRF token with profile PATCH requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { displayName: 'New Name' } }),
    });

    vi.stubGlobal('fetch', fetchMock);
    setCsrfToken('csrf-test');

    await apiFetch('/users/me', {
      method: 'PATCH',
      body: { displayName: 'New Name' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/users/me',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'same-origin',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'csrf-test',
        }),
        body: JSON.stringify({ displayName: 'New Name' }),
      }),
    );
  });
});
