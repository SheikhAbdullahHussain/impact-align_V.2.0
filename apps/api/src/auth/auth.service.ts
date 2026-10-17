import { generateToken, hashToken, type PasswordHasher } from '@impactalign/auth';
import { AuditEvent } from '@impactalign/types';
import type { LoginInput, RegisterInput } from '@impactalign/validation';
import { HttpError } from '../common/http-error';
import {
  DuplicateEmailError,
  type OneTimeTokenKind,
  type Repositories,
  type SessionRecord,
  type UserRecord,
} from '../data/repositories';
import type { AuditService } from './audit.service';
import type { EmailSender } from './email';

export interface RequestContext {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  requestId?: string | undefined;
}

export interface AuthServiceOptions {
  sessionIdleMs: number;
  sessionAbsoluteMs: number;
  verificationTtlMs: number;
  resetTtlMs: number;
  maxFailedAttempts: number;
  lockoutWindowMs: number;
  webUrl: string;
}

export interface AuthDeps {
  repos: Repositories;
  hasher: PasswordHasher;
  email: EmailSender;
  audit: AuditService;
  clock: () => Date;
  options: AuthServiceOptions;
}

export interface LoginResult {
  user: UserRecord;
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
}
export interface AuthContext {
  user: UserRecord;
  session: SessionRecord;
}

const INVALID_TOKEN = () =>
  new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', 'This link is invalid or has expired');

export class AuthService {
  private dummyHash: Promise<string> | undefined;

  constructor(private readonly deps: AuthDeps) {}

  /** Same response whether or not the email exists (no account enumeration). */
  async register(input: RegisterInput, ctx: RequestContext): Promise<void> {
    const { repos, email, audit, hasher } = this.deps;
    const passwordHash = await hasher.hash(input.password); // always hash: equal timing either way
    const exists = async () => {
      await email.sendAccountExists({ to: input.email });
      await audit.record({
        action: AuditEvent.USER_REGISTERED,
        outcome: 'failure',
        requestId: ctx.requestId,
        ipAddress: ctx.ipAddress,
        metadata: { reason: 'email_exists' },
      });
    };

    if (await repos.users.findByEmail(input.email)) return exists();
    let user: UserRecord;
    try {
      user = await repos.users.create({
        email: input.email,
        displayName: input.displayName,
        passwordHash,
        roles: [input.accountType],
      });
    } catch (err) {
      if (err instanceof DuplicateEmailError) return exists();
      throw err;
    }
    await this.issueToken(
      'email_verification',
      user,
      this.deps.options.verificationTtlMs,
      'verify-email',
    );
    await audit.record({
      action: AuditEvent.USER_REGISTERED,
      outcome: 'success',
      actorId: user.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
  }

  async verifyEmail(token: string, ctx: RequestContext): Promise<void> {
    const { repos, audit, clock } = this.deps;
    const record = await repos.tokens.consume('email_verification', hashToken(token), clock());
    if (!record) throw INVALID_TOKEN();
    await repos.users.setEmailVerified(record.userId, clock());
    await audit.record({
      action: AuditEvent.EMAIL_VERIFIED,
      outcome: 'success',
      actorId: record.userId,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
  }

  async login(input: LoginInput, ctx: RequestContext): Promise<LoginResult> {
    const { repos, hasher, clock, options } = this.deps;
    const now = clock();
    const failures = await repos.loginAttempts.countFailedSince(
      input.email,
      new Date(now.getTime() - options.lockoutWindowMs),
    );
    if (failures >= options.maxFailedAttempts) {
      await this.auditLogin('failure', null, ctx, 'locked');
      throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Too many failed attempts. Try again later.');
    }

    const user = await repos.users.findByEmail(input.email);
    // Verify against a dummy hash for unknown emails so timing does not reveal which emails exist.
    const passwordOk = await hasher.verify(
      input.password,
      user?.passwordHash ?? (await this.getDummyHash()),
    );
    if (!user || !passwordOk || user.status !== 'active') {
      await repos.loginAttempts.record({
        email: input.email,
        success: false,
        ipAddress: ctx.ipAddress,
        at: now,
      });
      await this.auditLogin('failure', user?.id ?? null, ctx, 'invalid_credentials');
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.emailVerifiedAt) {
      await this.auditLogin('failure', user.id, ctx, 'email_not_verified');
      throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before signing in');
    }

    await repos.loginAttempts.clearFailed(input.email);
    await repos.loginAttempts.record({
      email: input.email,
      success: true,
      ipAddress: ctx.ipAddress,
      at: now,
    });
    if (hasher.needsRehash(user.passwordHash)) {
      await repos.users.setPasswordHash(user.id, await hasher.hash(input.password));
    }
    const session = await this.createSession(user.id, ctx);
    await this.auditLogin('success', user.id, ctx);
    return { user, ...session };
  }

  /** Resolves a session cookie value to the signed-in user, or null when missing/expired/revoked. */
  async authenticate(sessionToken: string | undefined): Promise<AuthContext | null> {
    if (!sessionToken || sessionToken.length > 200) return null;
    const { repos, clock, options } = this.deps;
    const session = await repos.sessions.findByTokenHash(hashToken(sessionToken));
    if (!session || session.revokedAt) return null;

    const now = clock();
    if (now >= session.absoluteExpiresAt || now >= session.idleExpiresAt) {
      await repos.sessions.revoke(session.id, now);
      return null;
    }
    const user = await repos.users.findById(session.userId);
    if (!user || user.status !== 'active') return null;

    if (now.getTime() - session.lastSeenAt.getTime() > 60_000) {
      const idle = new Date(
        Math.min(now.getTime() + options.sessionIdleMs, session.absoluteExpiresAt.getTime()),
      );
      await repos.sessions.touch(session.id, now, idle);
    }
    return { user, session };
  }

  async logout(auth: AuthContext, ctx: RequestContext): Promise<void> {
    await this.deps.repos.sessions.revoke(auth.session.id, this.deps.clock());
    await this.deps.audit.record({
      action: AuditEvent.LOGOUT,
      outcome: 'success',
      actorId: auth.user.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
  }

  /** Always succeeds from the caller's point of view (no account enumeration). */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.deps.repos.users.findByEmail(email);
    if (user)
      await this.issueToken('password_reset', user, this.deps.options.resetTtlMs, 'reset-password');
  }

  async resetPassword(token: string, newPassword: string, ctx: RequestContext): Promise<void> {
    const { repos, hasher, audit, clock } = this.deps;
    const record = await repos.tokens.consume('password_reset', hashToken(token), clock());
    const user = record ? await repos.users.findById(record.userId) : null;
    if (!record || !user) throw INVALID_TOKEN();

    await repos.users.setPasswordHash(user.id, await hasher.hash(newPassword));
    if (!user.emailVerifiedAt) await repos.users.setEmailVerified(user.id, clock()); // proved mailbox control
    await repos.sessions.revokeAllForUser(user.id, clock());
    await repos.loginAttempts.clearFailed(user.email);
    await audit.record({
      action: AuditEvent.PASSWORD_RESET,
      outcome: 'success',
      actorId: user.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
  }

  async changePassword(
    auth: AuthContext,
    currentPassword: string,
    newPassword: string,
    ctx: RequestContext,
  ): Promise<void> {
    const { repos, hasher, audit, clock } = this.deps;
    if (!(await hasher.verify(currentPassword, auth.user.passwordHash))) {
      throw new HttpError(400, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
    }
    await repos.users.setPasswordHash(auth.user.id, await hasher.hash(newPassword));
    await repos.sessions.revokeAllForUser(auth.user.id, clock(), auth.session.id);
    await audit.record({
      action: AuditEvent.PASSWORD_CHANGED,
      outcome: 'success',
      actorId: auth.user.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.deps.hasher.hash(generateToken().token);
    return this.dummyHash;
  }

  private async createSession(userId: string, ctx: RequestContext) {
    const { repos, clock, options } = this.deps;
    const now = clock();
    const { token, hash } = generateToken();
    const absolute = new Date(now.getTime() + options.sessionAbsoluteMs);
    const idle = new Date(Math.min(now.getTime() + options.sessionIdleMs, absolute.getTime()));
    const csrfToken = generateToken().token;
    await repos.sessions.create({
      userId,
      tokenHash: hash,
      csrfToken,
      lastSeenAt: now,
      idleExpiresAt: idle,
      absoluteExpiresAt: absolute,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return { sessionToken: token, csrfToken, expiresAt: absolute };
  }

  private async issueToken(
    kind: OneTimeTokenKind,
    user: UserRecord,
    ttlMs: number,
    path: string,
  ): Promise<void> {
    const { repos, email, clock, options } = this.deps;
    await repos.tokens.invalidateAllForUser(kind, user.id, clock());
    const { token, hash } = generateToken();
    await repos.tokens.create(kind, {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(clock().getTime() + ttlMs),
    });
    const link = `${options.webUrl}/${path}?token=${token}`;
    if (kind === 'email_verification') await email.sendVerification({ to: user.email, link });
    else await email.sendPasswordReset({ to: user.email, link });
  }

  private auditLogin(
    outcome: 'success' | 'failure',
    actorId: string | null,
    ctx: RequestContext,
    reason?: string,
  ) {
    return this.deps.audit.record({
      action: outcome === 'success' ? AuditEvent.LOGIN_SUCCESS : AuditEvent.LOGIN_FAILED,
      outcome,
      actorId,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      ...(reason ? { metadata: { reason } } : {}),
    });
  }
}
