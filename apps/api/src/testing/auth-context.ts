import { createScryptHasher } from '@impactalign/auth';
import { AuditService } from '../auth/audit.service';
import { AuthService, type AuthServiceOptions } from '../auth/auth.service';
import type { EmailSender } from '../auth/email';
import { createLogger } from '../common/logger';
import { createMemoryRepositories } from './memory-repositories';

export interface SentEmail {
  kind: 'verify' | 'reset' | 'exists';
  to: string;
  link?: string;
}

export class RecordingEmailSender implements EmailSender {
  readonly sent: SentEmail[] = [];
  async sendVerification(m: { to: string; link: string }) {
    this.sent.push({ kind: 'verify', ...m });
  }
  async sendPasswordReset(m: { to: string; link: string }) {
    this.sent.push({ kind: 'reset', ...m });
  }
  async sendAccountExists(m: { to: string }) {
    this.sent.push({ kind: 'exists', ...m });
  }
  /** Token from the most recent email of this kind sent to this address. */
  tokenFor(kind: SentEmail['kind'], to: string): string {
    const mail = [...this.sent].reverse().find((e) => e.kind === kind && e.to === to);
    const token = mail?.link ? new URL(mail.link).searchParams.get('token') : null;
    if (!token) throw new Error(`No ${kind} email for ${to}`);
    return token;
  }
}

export const STRONG_PASSWORD = 'correct-horse-battery-9';

const defaultOptions: AuthServiceOptions = {
  sessionIdleMs: 60 * 60_000,
  sessionAbsoluteMs: 24 * 60 * 60_000,
  verificationTtlMs: 24 * 60 * 60_000,
  resetTtlMs: 60 * 60_000,
  maxFailedAttempts: 3,
  lockoutWindowMs: 15 * 60_000,
  webUrl: 'http://localhost:3000',
};

/** Fully wired AuthService on in-memory data, with a controllable clock and cheap password hashing. */
export function buildAuthTestContext(overrides: Partial<AuthServiceOptions> = {}) {
  const repos = createMemoryRepositories();
  const email = new RecordingEmailSender();
  const logger = createLogger({ NODE_ENV: 'test', LOG_LEVEL: 'silent' });
  // Start at the real current time so cookie jars (which use the real clock) keep the cookies.
  const clock = { now: new Date() };
  const hasher = createScryptHasher({ log2N: 4 });
  const audit = new AuditService(repos.audit, logger);
  const auth = new AuthService({
    repos,
    hasher,
    email,
    audit,
    clock: () => clock.now,
    options: { ...defaultOptions, ...overrides },
  });
  const advance = (ms: number) => {
    clock.now = new Date(clock.now.getTime() + ms);
  };
  const ctx = { ipAddress: '203.0.113.7', requestId: 'req-test-1' };

  /** Registers, verifies and returns a signed-in user. */
  async function signUp(address: string, password = STRONG_PASSWORD) {
    await auth.register(
      { email: address, password, displayName: 'Test User', accountType: 'PROFESSIONAL' },
      ctx,
    );
    await auth.verifyEmail(email.tokenFor('verify', address), ctx);
    return auth.login({ email: address, password }, ctx);
  }
  return { auth, audit, repos, email, hasher, clock, advance, ctx, signUp };
}
