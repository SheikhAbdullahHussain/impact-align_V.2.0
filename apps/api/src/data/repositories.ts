import type { AuditEvent, PlatformRole } from '@impactalign/types';

export class DuplicateEmailError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'DuplicateEmailError';
  }
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  roles: PlatformRole[];
  status: 'active' | 'disabled';
  emailVerifiedAt: Date | null;
  createdAt: Date;
}
export interface NewUser {
  email: string;
  displayName: string;
  passwordHash: string;
  roles: PlatformRole[];
}
export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /** Throws DuplicateEmailError when the email already exists. */
  create(data: NewUser): Promise<UserRecord>;
  setEmailVerified(id: string, at: Date): Promise<void>;
  setPasswordHash(id: string, passwordHash: string): Promise<void>;
  setDisplayName(id: string, displayName: string): Promise<void>;
  setRoles(id: string, roles: PlatformRole[]): Promise<void>;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  csrfToken: string;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}
export type NewSession = Omit<SessionRecord, 'id' | 'revokedAt'>;
export interface SessionRepository {
  create(data: NewSession): Promise<SessionRecord>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  touch(id: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void>;
  revoke(id: string, at: Date): Promise<void>;
  /** Revokes every active session of the user (optionally keeping one). Returns how many. */
  revokeAllForUser(userId: string, at: Date, exceptId?: string): Promise<number>;
}

export type OneTimeTokenKind = 'email_verification' | 'password_reset';
export interface OneTimeTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}
export interface OneTimeTokenRepository {
  create(
    kind: OneTimeTokenKind,
    data: { userId: string; tokenHash: string; expiresAt: Date },
  ): Promise<void>;
  /** Atomically marks an unused, unexpired token as used and returns it; otherwise null. */
  consume(kind: OneTimeTokenKind, tokenHash: string, now: Date): Promise<OneTimeTokenRecord | null>;
  invalidateAllForUser(kind: OneTimeTokenKind, userId: string, now: Date): Promise<void>;
}

export interface LoginAttemptRepository {
  record(data: {
    email: string;
    success: boolean;
    ipAddress?: string | undefined;
    at: Date;
  }): Promise<void>;
  countFailedSince(email: string, since: Date): Promise<number>;
  clearFailed(email: string): Promise<void>;
}

export interface AuditEntry {
  action: AuditEvent;
  outcome: 'success' | 'failure';
  actorId?: string | null;
  organizationId?: string | null;
  resourceType?: string;
  resourceId?: string;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  metadata?: Record<string, unknown>;
}
export interface AuditRepository {
  insert(entry: AuditEntry): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  sessions: SessionRepository;
  tokens: OneTimeTokenRepository;
  loginAttempts: LoginAttemptRepository;
  audit: AuditRepository;
}
