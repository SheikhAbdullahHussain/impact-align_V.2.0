import { describe, expect, it } from 'vitest';
import { hashToken } from '@impactalign/auth';
import { AuditEvent } from '@impactalign/types';
import { HttpError } from '../common/http-error';
import { buildAuthTestContext, STRONG_PASSWORD } from '../testing/auth-context';

const register = (c: ReturnType<typeof buildAuthTestContext>, email: string) =>
  c.auth.register(
    { email, password: STRONG_PASSWORD, displayName: 'Ada Lovelace', accountType: 'RESEARCHER' },
    c.ctx,
  );

const rejects = async (promise: Promise<unknown>, status: number, code: string) => {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(HttpError);
  expect(err).toMatchObject({ status, code });
};

describe('registration', () => {
  it('stores a hash (never the password), gives the chosen role and sends a verification link', async () => {
    const c = buildAuthTestContext();
    await register(c, 'ada@example.org');
    const user = c.repos.data.users[0]!;
    expect(user.passwordHash).not.toContain(STRONG_PASSWORD);
    expect(user.roles).toEqual(['RESEARCHER']);
    expect(user.emailVerifiedAt).toBeNull();
    expect(c.email.tokenFor('verify', 'ada@example.org').length).toBeGreaterThan(40);
  });

  it('stores only the hash of the verification token', async () => {
    const c = buildAuthTestContext();
    await register(c, 'ada@example.org');
    const token = c.email.tokenFor('verify', 'ada@example.org');
    expect(c.repos.data.tokens.email_verification[0]!.tokenHash).toBe(hashToken(token));
    expect(JSON.stringify(c.repos.data.tokens)).not.toContain(token);
  });

  it('does not reveal whether an email is registered', async () => {
    const c = buildAuthTestContext();
    await register(c, 'ada@example.org');
    await expect(register(c, 'ada@example.org')).resolves.toBeUndefined(); // same outcome
    expect(c.repos.data.users).toHaveLength(1);
    expect(c.email.sent.at(-1)?.kind).toBe('exists');
  });
});

describe('email verification', () => {
  it('blocks login until verified, then allows it', async () => {
    const c = buildAuthTestContext();
    await register(c, 'ada@example.org');
    await rejects(
      c.auth.login({ email: 'ada@example.org', password: STRONG_PASSWORD }, c.ctx),
      403,
      'EMAIL_NOT_VERIFIED',
    );
    await c.auth.verifyEmail(c.email.tokenFor('verify', 'ada@example.org'), c.ctx);
    await expect(
      c.auth.login({ email: 'ada@example.org', password: STRONG_PASSWORD }, c.ctx),
    ).resolves.toBeDefined();
  });

  it('rejects an unknown, reused or expired token', async () => {
    const c = buildAuthTestContext();
    await register(c, 'ada@example.org');
    const token = c.email.tokenFor('verify', 'ada@example.org');
    await rejects(c.auth.verifyEmail('x'.repeat(43), c.ctx), 400, 'INVALID_OR_EXPIRED_TOKEN');
    await c.auth.verifyEmail(token, c.ctx);
    await rejects(c.auth.verifyEmail(token, c.ctx), 400, 'INVALID_OR_EXPIRED_TOKEN');

    await register(c, 'bob@example.org');
    const late = c.email.tokenFor('verify', 'bob@example.org');
    c.advance(25 * 60 * 60_000);
    await rejects(c.auth.verifyEmail(late, c.ctx), 400, 'INVALID_OR_EXPIRED_TOKEN');
  });
});

describe('login', () => {
  it('gives the same error for a wrong password and an unknown email', async () => {
    const c = buildAuthTestContext();
    await c.signUp('ada@example.org');
    await rejects(
      c.auth.login({ email: 'ada@example.org', password: 'wrong-password-123' }, c.ctx),
      401,
      'INVALID_CREDENTIALS',
    );
    await rejects(
      c.auth.login({ email: 'nobody@example.org', password: 'wrong-password-123' }, c.ctx),
      401,
      'INVALID_CREDENTIALS',
    );
  });

  it('locks the account after repeated failures — also for unknown emails — and unlocks after the window', async () => {
    const c = buildAuthTestContext();
    await c.signUp('ada@example.org');
    for (const email of ['ada@example.org', 'ghost@example.org']) {
      for (let i = 0; i < 3; i += 1)
        await c.auth.login({ email, password: 'bad-password-1234' }, c.ctx).catch(() => null);
      await rejects(
        c.auth.login({ email, password: STRONG_PASSWORD }, c.ctx),
        429,
        'TOO_MANY_ATTEMPTS',
      );
    }
    c.advance(16 * 60_000);
    await expect(
      c.auth.login({ email: 'ada@example.org', password: STRONG_PASSWORD }, c.ctx),
    ).resolves.toBeDefined();
  });

  it('stores only the session token hash and issues a new session each time (no fixation)', async () => {
    const c = buildAuthTestContext();
    const first = await c.signUp('ada@example.org');
    const second = await c.auth.login(
      { email: 'ada@example.org', password: STRONG_PASSWORD },
      c.ctx,
    );
    expect(first.sessionToken).not.toBe(second.sessionToken);
    expect(JSON.stringify(c.repos.data.sessions)).not.toContain(first.sessionToken);
    expect(c.repos.data.sessions[0]!.tokenHash).toBe(hashToken(first.sessionToken));
  });

  it('writes audit events for success and failure', async () => {
    const c = buildAuthTestContext();
    await c.signUp('ada@example.org');
    await c.auth
      .login({ email: 'ada@example.org', password: 'wrong-password-123' }, c.ctx)
      .catch(() => null);
    const events = c.repos.data.audit.map((e) => `${e.action}:${e.outcome}`);
    expect(events).toContain(`${AuditEvent.LOGIN_SUCCESS}:success`);
    expect(events).toContain(`${AuditEvent.LOGIN_FAILED}:failure`);
    expect(events).toContain(`${AuditEvent.EMAIL_VERIFIED}:success`);
    expect(JSON.stringify(c.repos.data.audit)).not.toContain(STRONG_PASSWORD);
  });
});

describe('sessions', () => {
  it('authenticates a valid session and rejects garbage', async () => {
    const c = buildAuthTestContext();
    const { sessionToken, user } = await c.signUp('ada@example.org');
    expect((await c.auth.authenticate(sessionToken))?.user.id).toBe(user.id);
    expect(await c.auth.authenticate(undefined)).toBeNull();
    expect(await c.auth.authenticate('not-a-real-token')).toBeNull();
  });

  it('expires after the idle timeout and revokes the session', async () => {
    const c = buildAuthTestContext();
    const { sessionToken } = await c.signUp('ada@example.org');
    c.advance(61 * 60_000);
    expect(await c.auth.authenticate(sessionToken)).toBeNull();
    expect(c.repos.data.sessions[0]!.revokedAt).not.toBeNull();
  });

  it('expires at the absolute limit even when the user stays active', async () => {
    const c = buildAuthTestContext();
    const { sessionToken } = await c.signUp('ada@example.org');
    for (let i = 0; i < 23; i += 1) {
      c.advance(50 * 60_000);
      if (!(await c.auth.authenticate(sessionToken))) break;
    }
    c.advance(60 * 60_000);
    expect(await c.auth.authenticate(sessionToken)).toBeNull();
  });

  it('logout revokes the session', async () => {
    const c = buildAuthTestContext();
    const { sessionToken } = await c.signUp('ada@example.org');
    await c.auth.logout((await c.auth.authenticate(sessionToken))!, c.ctx);
    expect(await c.auth.authenticate(sessionToken)).toBeNull();
  });

  it('stops working when the account is disabled', async () => {
    const c = buildAuthTestContext();
    const { sessionToken } = await c.signUp('ada@example.org');
    c.repos.data.users[0]!.status = 'disabled';
    expect(await c.auth.authenticate(sessionToken)).toBeNull();
  });
});

describe('password reset', () => {
  it('rejects invalid tokens', async () => {
    const c = buildAuthTestContext();
    await rejects(
      c.auth.resetPassword('x'.repeat(43), 'new-password-12345', c.ctx),
      400,
      'INVALID_OR_EXPIRED_TOKEN',
    );
  });

  it('says nothing about unknown emails', async () => {
    const c = buildAuthTestContext();
    await expect(c.auth.forgotPassword('ghost@example.org')).resolves.toBeUndefined();
    expect(c.email.sent).toHaveLength(0);
  });

  it('works once, ends all sessions, unlocks the account and accepts the new password', async () => {
    const c = buildAuthTestContext();
    const { sessionToken } = await c.signUp('ada@example.org');
    await c.auth.forgotPassword('ada@example.org');
    const token = c.email.tokenFor('reset', 'ada@example.org');

    await c.auth.resetPassword(token, 'brand-new-password-1', c.ctx);
    expect(await c.auth.authenticate(sessionToken)).toBeNull();
    await rejects(
      c.auth.resetPassword(token, 'another-password-12', c.ctx),
      400,
      'INVALID_OR_EXPIRED_TOKEN',
    ); // one-time
    await rejects(
      c.auth.login({ email: 'ada@example.org', password: STRONG_PASSWORD }, c.ctx),
      401,
      'INVALID_CREDENTIALS',
    );
    await expect(
      c.auth.login({ email: 'ada@example.org', password: 'brand-new-password-1' }, c.ctx),
    ).resolves.toBeDefined();
    expect(c.repos.data.audit.map((e) => e.action)).toContain(AuditEvent.PASSWORD_RESET);
  });

  it('expires after an hour and a newer request invalidates the older link', async () => {
    const c = buildAuthTestContext();
    await c.signUp('ada@example.org');
    await c.auth.forgotPassword('ada@example.org');
    const old = c.email.tokenFor('reset', 'ada@example.org');
    await c.auth.forgotPassword('ada@example.org');
    await rejects(
      c.auth.resetPassword(old, 'brand-new-password-1', c.ctx),
      400,
      'INVALID_OR_EXPIRED_TOKEN',
    );
    const fresh = c.email.tokenFor('reset', 'ada@example.org');
    c.advance(61 * 60_000);
    await rejects(
      c.auth.resetPassword(fresh, 'brand-new-password-1', c.ctx),
      400,
      'INVALID_OR_EXPIRED_TOKEN',
    );
  });
});

describe('change password', () => {
  it('needs the current password, then ends the other sessions but keeps this one', async () => {
    const c = buildAuthTestContext();
    const first = await c.signUp('ada@example.org');
    const second = await c.auth.login(
      { email: 'ada@example.org', password: STRONG_PASSWORD },
      c.ctx,
    );
    const current = (await c.auth.authenticate(second.sessionToken))!;

    await rejects(
      c.auth.changePassword(current, 'wrong-current-password', 'brand-new-password-1', c.ctx),
      400,
      'INVALID_CURRENT_PASSWORD',
    );
    await c.auth.changePassword(current, STRONG_PASSWORD, 'brand-new-password-1', c.ctx);
    expect(await c.auth.authenticate(first.sessionToken)).toBeNull();
    expect(await c.auth.authenticate(second.sessionToken)).not.toBeNull();
    expect(c.repos.data.audit.map((e) => e.action)).toContain(AuditEvent.PASSWORD_CHANGED);
  });
});
