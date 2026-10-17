import { randomUUID } from 'node:crypto';
import {
  DuplicateEmailError,
  type AuditEntry,
  type OneTimeTokenKind,
  type OneTimeTokenRecord,
  type Repositories,
  type SessionRecord,
  type UserRecord,
} from '../data/repositories';

/** In-memory repositories for tests. They mimic the atomic behaviour the real adapters must have. */
export interface MemoryRepositories extends Repositories {
  data: {
    users: UserRecord[];
    sessions: SessionRecord[];
    tokens: Record<OneTimeTokenKind, OneTimeTokenRecord[]>;
    attempts: { email: string; success: boolean; at: Date }[];
    audit: AuditEntry[];
  };
}

export function createMemoryRepositories(): MemoryRepositories {
  const data: MemoryRepositories['data'] = {
    users: [],
    sessions: [],
    tokens: { email_verification: [], password_reset: [] },
    attempts: [],
    audit: [],
  };
  const user = (id: string) => data.users.find((u) => u.id === id);

  return {
    data,
    users: {
      async findByEmail(email) {
        return data.users.find((u) => u.email === email) ?? null;
      },
      async findById(id) {
        return user(id) ?? null;
      },
      async create(input) {
        if (data.users.some((u) => u.email === input.email)) throw new DuplicateEmailError();
        const record: UserRecord = {
          id: randomUUID(),
          ...input,
          status: 'active',
          emailVerifiedAt: null,
          createdAt: new Date(),
        };
        data.users.push(record);
        return record;
      },
      async setEmailVerified(id, at) {
        const u = user(id);
        if (u) u.emailVerifiedAt = at;
      },
      async setPasswordHash(id, passwordHash) {
        const u = user(id);
        if (u) u.passwordHash = passwordHash;
      },
      async setDisplayName(id, displayName) {
        const u = user(id);
        if (u) u.displayName = displayName;
      },
      async setRoles(id, roles) {
        const u = user(id);
        if (u) u.roles = roles;
      },
    },
    sessions: {
      async create(input) {
        const record: SessionRecord = { id: randomUUID(), revokedAt: null, ...input };
        data.sessions.push(record);
        return record;
      },
      async findByTokenHash(tokenHash) {
        return data.sessions.find((s) => s.tokenHash === tokenHash) ?? null;
      },
      async touch(id, lastSeenAt, idleExpiresAt) {
        const s = data.sessions.find((x) => x.id === id);
        if (s) Object.assign(s, { lastSeenAt, idleExpiresAt });
      },
      async revoke(id, at) {
        const s = data.sessions.find((x) => x.id === id);
        if (s && !s.revokedAt) s.revokedAt = at;
      },
      async revokeAllForUser(userId, at, exceptId) {
        const active = data.sessions.filter(
          (s) => s.userId === userId && !s.revokedAt && s.id !== exceptId,
        );
        active.forEach((s) => (s.revokedAt = at));
        return active.length;
      },
    },
    tokens: {
      async create(kind, input) {
        data.tokens[kind].push({ id: randomUUID(), usedAt: null, ...input });
      },
      async consume(kind, tokenHash, now) {
        const t = data.tokens[kind].find(
          (x) => x.tokenHash === tokenHash && !x.usedAt && x.expiresAt > now,
        );
        if (!t) return null;
        t.usedAt = now;
        return { ...t };
      },
      async invalidateAllForUser(kind, userId, now) {
        data.tokens[kind]
          .filter((t) => t.userId === userId && !t.usedAt)
          .forEach((t) => (t.usedAt = now));
      },
    },
    loginAttempts: {
      async record({ email, success, at }) {
        data.attempts.push({ email, success, at });
      },
      async countFailedSince(email, since) {
        return data.attempts.filter((a) => a.email === email && !a.success && a.at >= since).length;
      },
      async clearFailed(email) {
        data.attempts = data.attempts.filter((a) => !(a.email === email && !a.success));
      },
    },
    audit: {
      async insert(entry) {
        data.audit.push(entry);
      },
    },
  };
}
