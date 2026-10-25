import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  EmailVerification,
  LoginAttempt,
  Organization,
  OrganizationMember,
  PasswordResetToken,
  Session,
  User,
} from './index';

const id = () => new Types.ObjectId();
const indexKeys = (model: { schema: { indexes(): [Record<string, unknown>, object][] } }) =>
  model.schema.indexes().map(([keys]) => Object.keys(keys).join('+'));

describe('User', () => {
  it('requires email, display name and password hash', () => {
    const errors = new User({}).validateSync()?.errors ?? {};
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(['email', 'displayName', 'passwordHash']),
    );
  });

  it('defaults to PUBLIC_USER, normalises email, hides the hash by default', () => {
    const user = new User({ email: '  Ada@Example.ORG ', displayName: 'Ada', passwordHash: 'x' });
    expect(user.validateSync()).toBeUndefined();
    expect(user.email).toBe('ada@example.org');
    expect([...user.roles]).toEqual(['PUBLIC_USER']);
    expect(User.schema.path('passwordHash').options.select).toBe(false);
  });

  it('rejects unknown roles and organization roles on the user', () => {
    for (const role of ['GOD_MODE', 'ORGANIZATION_ADMIN']) {
      const user = new User({
        email: 'a@b.co',
        displayName: 'Ab',
        passwordHash: 'x',
        roles: [role],
      });
      expect(user.validateSync()?.errors['roles.0']).toBeDefined();
    }
  });

  it('enforces a unique email', () => {
    expect(indexKeys(User)).toContain('email');
  });
});

describe('Session and tokens', () => {
  it('sessions require a token hash and expiries, and expire automatically', () => {
    expect(Object.keys(new Session({}).validateSync()?.errors ?? {})).toEqual(
      expect.arrayContaining([
        'userId',
        'tokenHash',
        'csrfToken',
        'idleExpiresAt',
        'absoluteExpiresAt',
      ]),
    );
    expect(Session.schema.path('absoluteExpiresAt').options.index).toEqual({
      expireAfterSeconds: 0,
    });
    expect(Session.schema.path('tokenHash').options.unique).toBe(true);
  });

  it.each([EmailVerification, PasswordResetToken])(
    'one-time tokens are hashed, unique and expiring',
    (Model) => {
      const doc = new Model({ userId: id(), tokenHash: 'h', expiresAt: new Date() });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.usedAt).toBeNull();
      expect(Model.schema.path('tokenHash').options.unique).toBe(true);
    },
  );
});

describe('LoginAttempt', () => {
  it('records outcome per email and ages out after 30 days', () => {
    expect(new LoginAttempt({ email: 'A@B.co', success: false }).email).toBe('a@b.co');
    expect(LoginAttempt.schema.path('createdAt').options.expires).toBe(60 * 60 * 24 * 30);
  });
});

describe('Organization and membership', () => {
  it('limits membership roles and makes (organization, user) unique', () => {
    const bad = new OrganizationMember({ organizationId: id(), userId: id(), role: 'ADMIN' });
    expect(bad.validateSync()?.errors['role']).toBeDefined();
    const ok = new OrganizationMember({
      organizationId: id(),
      userId: id(),
      role: 'ORGANIZATION_MEMBER',
    });
    expect(ok.validateSync()).toBeUndefined();
    expect(indexKeys(OrganizationMember)).toContain('organizationId+userId');
  });

  it('requires a name, slug and creator', () => {
    expect(Object.keys(new Organization({}).validateSync()?.errors ?? {})).toEqual(
      expect.arrayContaining(['name', 'slug', 'createdById']),
    );
  });
});
