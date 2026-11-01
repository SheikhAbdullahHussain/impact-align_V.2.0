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
import {
  SDG,
  SDGTarget,
  SDGIndicator,
  Framework,
  FrameworkVersion,
  Criterion,
  EvidenceRequirement,
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

describe('SDG catalogue models', () => {
  it('requires a valid SDG number and code', () => {
    expect(new SDG({}).validateSync()?.errors).toHaveProperty('number');
    expect(new SDG({}).validateSync()?.errors).toHaveProperty('code');

    const sdg = new SDG({
      number: 1,
      code: 'SDG-01',
    });

    expect(sdg.validateSync()).toBeUndefined();
    expect(sdg.title).toBeNull();
    expect(sdg.deletedAt).toBeNull();
  });

  it('limits SDG numbers to 1–17', () => {
    expect(new SDG({ number: 18, code: 'SDG-18' }).validateSync()).toBeDefined();
    expect(new SDG({ number: 1, code: 'SDG-01' }).validateSync()).toBeUndefined();
  });

  it('indexes SDG targets and indicators by their relationships', () => {
    expect(indexKeys(SDGTarget)).toContain('sdgId+code');
    expect(indexKeys(SDGIndicator)).toContain('sdgId+code');
    expect(indexKeys(SDGIndicator)).toContain('targetId');
  });

  it('requires target and indicator identifiers', () => {
    expect(
      Object.keys(new SDGTarget({}).validateSync()?.errors ?? {}),
    ).toEqual(expect.arrayContaining(['sdgId', 'code']));

    expect(
      Object.keys(new SDGIndicator({}).validateSync()?.errors ?? {}),
    ).toEqual(expect.arrayContaining(['sdgId', 'code']));
  });
});

describe('Framework models', () => {
  it('requires framework name and slug', () => {
    expect(
      Object.keys(new Framework({}).validateSync()?.errors ?? {}),
    ).toEqual(expect.arrayContaining(['name', 'slug']));
  });

  it('enforces framework version relationships', () => {
    expect(
      Object.keys(new FrameworkVersion({}).validateSync()?.errors ?? {}),
    ).toEqual(expect.arrayContaining(['frameworkId', 'version']));
  });

  it('requires criterion and evidence requirement relationships', () => {
    expect(
      Object.keys(new Criterion({}).validateSync()?.errors ?? {}),
    ).toEqual(expect.arrayContaining(['frameworkVersionId', 'code']));

    expect(
      Object.keys(new EvidenceRequirement({}).validateSync()?.errors ?? {}),
    ).toEqual(expect.arrayContaining(['criterionId', 'code']));
  });

  it('creates unique indexes for framework hierarchy codes', () => {
    expect(indexKeys(FrameworkVersion)).toContain('frameworkId+version');
    expect(indexKeys(Criterion)).toContain('frameworkVersionId+code');
    expect(indexKeys(EvidenceRequirement)).toContain('criterionId+code');
  });
});