import { describe, expect, it } from 'vitest';
import { createScryptHasher } from '@impactalign/auth';
import { createMemoryRepositories } from '../testing/memory-repositories';
import { createSuperAdmin } from './bootstrap';

const hasher = createScryptHasher({ log2N: 4 });

describe('createSuperAdmin', () => {
  it('creates a verified SUPER_ADMIN with a hashed password and an audit entry', async () => {
    const repos = createMemoryRepositories();
    const user = await createSuperAdmin(repos, hasher, {
      email: 'Root@Example.org',
      password: 'correct-horse-battery-9',
    });
    const stored = repos.data.users[0]!;
    expect(user.email).toBe('root@example.org');
    expect(stored.roles).toEqual(['SUPER_ADMIN']);
    expect(stored.emailVerifiedAt).not.toBeNull();
    expect(stored.passwordHash).not.toContain('correct-horse');
    expect(repos.data.audit[0]).toMatchObject({
      action: 'ROLE_CHANGED',
      metadata: { bootstrap: true },
    });
  });

  it('refuses to touch an existing account and rejects weak passwords', async () => {
    const repos = createMemoryRepositories();
    await createSuperAdmin(repos, hasher, {
      email: 'root@example.org',
      password: 'correct-horse-battery-9',
    });
    await expect(
      createSuperAdmin(repos, hasher, {
        email: 'root@example.org',
        password: 'another-strong-pass-1',
      }),
    ).rejects.toThrow(/already exists/);
    await expect(
      createSuperAdmin(repos, hasher, { email: 'x@example.org', password: 'short' }),
    ).rejects.toThrow();
    expect(repos.data.users).toHaveLength(1);
  });
});
