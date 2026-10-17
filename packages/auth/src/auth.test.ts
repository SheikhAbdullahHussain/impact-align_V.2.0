import { describe, expect, it } from 'vitest';
import { Permission, PLATFORM_ROLES, ORGANIZATION_ROLES } from '@impactalign/types';
import {
  canAssignRoles,
  createScryptHasher,
  generateToken,
  hasOrganizationPermission,
  hasPlatformPermission,
  hashToken,
  organizationRolePermissions,
  platformRolePermissions,
  safeEqual,
} from './index';

const cheap = createScryptHasher({ log2N: 4 });

describe('password hashing', () => {
  it('never stores the plaintext and verifies the right password only', async () => {
    const hash = await cheap.hash('correct horse battery staple');
    expect(hash).not.toContain('correct horse');
    expect(hash.startsWith('scrypt$4$8$1$')).toBe(true);
    expect(await cheap.verify('correct horse battery staple', hash)).toBe(true);
    expect(await cheap.verify('wrong password here', hash)).toBe(false);
  });

  it('uses a fresh salt every time', async () => {
    expect(await cheap.hash('same-password-123')).not.toBe(await cheap.hash('same-password-123'));
  });

  it('rejects malformed or tampered stored hashes instead of throwing', async () => {
    expect(await cheap.verify('x', 'garbage')).toBe(false);
    expect(await cheap.verify('x', 'scrypt$99$8$1$AAAA$BBBB')).toBe(false);
    expect(await cheap.verify('x', 'bcrypt$4$8$1$AAAA$BBBB')).toBe(false);
  });

  it('flags hashes made with weaker parameters for rehash', async () => {
    const strong = createScryptHasher({ log2N: 5 });
    expect(strong.needsRehash(await cheap.hash('pw-pw-pw-pw-pw'))).toBe(true);
    expect(cheap.needsRehash(await cheap.hash('pw-pw-pw-pw-pw'))).toBe(false);
    expect(cheap.needsRehash('not-a-hash')).toBe(true);
  });
});

describe('tokens', () => {
  it('returns a random token and a different stored hash', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(43);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });
  it('compares secrets safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('permission policy', () => {
  it('maps every role to a permission list', () => {
    for (const role of PLATFORM_ROLES) expect(platformRolePermissions[role]).toBeDefined();
    for (const role of ORGANIZATION_ROLES) expect(organizationRolePermissions[role]).toBeDefined();
  });

  it('gives SUPER_ADMIN everything and PUBLIC_USER nothing', () => {
    for (const permission of Object.values(Permission)) {
      expect(hasPlatformPermission(['SUPER_ADMIN'], permission)).toBe(true);
      expect(hasPlatformPermission(['PUBLIC_USER'], permission)).toBe(false);
    }
  });

  it('keeps platform staff out of organizations private data', () => {
    expect(hasPlatformPermission(['ADMIN'], Permission.ORG_READ)).toBe(false);
    expect(hasPlatformPermission(['ADMIN'], Permission.EVIDENCE_UPLOAD)).toBe(false);
  });

  it('distinguishes organization admins from members', () => {
    expect(hasOrganizationPermission('ORGANIZATION_ADMIN', Permission.ORG_MEMBER_MANAGE)).toBe(
      true,
    );
    expect(hasOrganizationPermission('ORGANIZATION_MEMBER', Permission.ORG_MEMBER_MANAGE)).toBe(
      false,
    );
    expect(hasOrganizationPermission('ORGANIZATION_MEMBER', Permission.EVIDENCE_SUBMIT)).toBe(
      false,
    );
  });
});

describe('canAssignRoles (privilege escalation)', () => {
  const base = { actorId: 'a', targetId: 't', targetRoles: ['PUBLIC_USER'] as const };

  it('requires the USER_ROLE_ASSIGN permission', () => {
    const r = canAssignRoles({
      ...base,
      actorRoles: ['PROFESSIONAL'],
      targetRoles: ['PUBLIC_USER'],
      newRoles: ['ASSESSOR'],
    });
    expect(r).toEqual({ ok: false, reason: 'missing_permission' });
  });
  it('blocks changing your own roles, even for SUPER_ADMIN', () => {
    const r = canAssignRoles({
      actorId: 'a',
      targetId: 'a',
      actorRoles: ['SUPER_ADMIN'],
      targetRoles: ['SUPER_ADMIN'],
      newRoles: ['PUBLIC_USER'],
    });
    expect(r).toEqual({ ok: false, reason: 'cannot_change_own_roles' });
  });
  it('stops ADMIN granting staff roles or editing staff', () => {
    expect(
      canAssignRoles({
        ...base,
        actorRoles: ['ADMIN'],
        targetRoles: ['PUBLIC_USER'],
        newRoles: ['SUPER_ADMIN'],
      }),
    ).toEqual({ ok: false, reason: 'cannot_grant_staff_role' });
    expect(
      canAssignRoles({
        ...base,
        actorRoles: ['ADMIN'],
        targetRoles: ['ADMIN'],
        newRoles: ['PUBLIC_USER'],
      }),
    ).toEqual({ ok: false, reason: 'target_is_staff' });
  });
  it('lets ADMIN assign ordinary roles and SUPER_ADMIN assign anything', () => {
    expect(
      canAssignRoles({
        ...base,
        actorRoles: ['ADMIN'],
        targetRoles: ['PUBLIC_USER'],
        newRoles: ['ASSESSOR'],
      }),
    ).toEqual({ ok: true });
    expect(
      canAssignRoles({
        ...base,
        actorRoles: ['SUPER_ADMIN'],
        targetRoles: ['PUBLIC_USER'],
        newRoles: ['ADMIN'],
      }),
    ).toEqual({ ok: true });
  });
});
