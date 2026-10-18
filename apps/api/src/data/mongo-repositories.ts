import { Types, trusted } from 'mongoose';
import type { PlatformRole } from '@impactalign/types';
import {
  AuditLog,
  EmailVerification,
  LoginAttempt,
  PasswordResetToken,
  Session,
  User,
} from '@impactalign/database';
import {
  DuplicateEmailError,
  type OneTimeTokenKind,
  type OneTimeTokenRecord,
  type Repositories,
  type SessionRecord,
  type UserRecord,
} from './repositories';

/** Strict check: 24 hex chars that round-trip (rejects 12-character strings Mongoose would accept). */
const isId = (id: string): boolean =>
  Types.ObjectId.isValid(id) && new Types.ObjectId(id).toHexString() === id;
const optionalId = (id: string | null | undefined) =>
  id && isId(id) ? new Types.ObjectId(id) : null;

interface LeanUser {
  _id: Types.ObjectId;
  email: string;
  displayName: string;
  passwordHash: string;
  roles: string[];
  status: string;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
}
interface LeanSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  csrfToken: string;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
interface LeanToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

const toUser = (d: LeanUser): UserRecord => ({
  id: d._id.toHexString(),
  email: d.email,
  displayName: d.displayName,
  passwordHash: d.passwordHash,
  roles: d.roles as PlatformRole[],
  status: d.status === 'disabled' ? 'disabled' : 'active',
  emailVerifiedAt: d.emailVerifiedAt ?? null,
  createdAt: d.createdAt,
});

const toSession = (d: LeanSession): SessionRecord => ({
  id: d._id.toHexString(),
  userId: d.userId.toHexString(),
  tokenHash: d.tokenHash,
  csrfToken: d.csrfToken,
  lastSeenAt: d.lastSeenAt,
  idleExpiresAt: d.idleExpiresAt,
  absoluteExpiresAt: d.absoluteExpiresAt,
  revokedAt: d.revokedAt ?? null,
  ipAddress: d.ipAddress ?? undefined,
  userAgent: d.userAgent ?? undefined,
});

const tokenModel = (kind: OneTimeTokenKind) =>
  (kind === 'email_verification'
    ? EmailVerification
    : PasswordResetToken) as typeof EmailVerification;

const isDuplicateKey = (err: unknown): boolean => (err as { code?: number } | null)?.code === 11000;

/**
 * MongoDB implementation of the repositories. Note: the connection uses sanitizeFilter, so every
 * filter that legitimately needs an operator ($gt, $ne, ...) is wrapped in trusted().
 */
export function createMongoRepositories(): Repositories {
  return {
    users: {
      async findByEmail(email) {
        const doc = await User.findOne({ email, deletedAt: null })
          .select('+passwordHash')
          .lean<LeanUser>();
        return doc ? toUser(doc) : null;
      },
      async findById(id) {
        if (!isId(id)) return null;
        const doc = await User.findOne({ _id: id, deletedAt: null })
          .select('+passwordHash')
          .lean<LeanUser>();
        return doc ? toUser(doc) : null;
      },
      async create(data) {
        try {
          const doc = await User.create({
            email: data.email,
            displayName: data.displayName,
            passwordHash: data.passwordHash,
            roles: data.roles,
          });
          return toUser(doc.toObject() as unknown as LeanUser);
        } catch (err) {
          if (isDuplicateKey(err)) throw new DuplicateEmailError();
          throw err;
        }
      },
      async setEmailVerified(id, at) {
        if (isId(id)) await User.updateOne({ _id: id }, { $set: { emailVerifiedAt: at } });
      },
      async setPasswordHash(id, passwordHash) {
        if (isId(id)) await User.updateOne({ _id: id }, { $set: { passwordHash } });
      },
      async setDisplayName(id, displayName) {
        if (isId(id)) await User.updateOne({ _id: id }, { $set: { displayName } });
      },
      async setRoles(id, roles) {
        if (isId(id)) await User.updateOne({ _id: id }, { $set: { roles } });
      },
    },

    sessions: {
      async create(data) {
        const doc = await Session.create({
          ...data,
          userId: new Types.ObjectId(data.userId),
          revokedAt: null,
        });
        return toSession(doc.toObject() as unknown as LeanSession);
      },
      async findByTokenHash(tokenHash) {
        const doc = await Session.findOne({ tokenHash }).lean<LeanSession>();
        return doc ? toSession(doc) : null;
      },
      async touch(id, lastSeenAt, idleExpiresAt) {
        if (isId(id)) await Session.updateOne({ _id: id }, { $set: { lastSeenAt, idleExpiresAt } });
      },
      async revoke(id, at) {
        if (isId(id))
          await Session.updateOne({ _id: id, revokedAt: null }, { $set: { revokedAt: at } });
      },
      async revokeAllForUser(userId, at, exceptId) {
        if (!isId(userId)) return 0;
        const filter = {
          userId,
          revokedAt: null,
          ...(exceptId && isId(exceptId)
            ? { _id: trusted({ $ne: new Types.ObjectId(exceptId) }) }
            : {}),
        };
        const result = await Session.updateMany(filter, { $set: { revokedAt: at } });
        return result.modifiedCount;
      },
    },

    tokens: {
      async create(kind, data) {
        await tokenModel(kind).create({ ...data, userId: new Types.ObjectId(data.userId) });
      },
      /** Atomic: only one caller can flip usedAt from null, so a link works exactly once. */
      async consume(kind, tokenHash, now): Promise<OneTimeTokenRecord | null> {
        const doc = await tokenModel(kind)
          .findOneAndUpdate(
            { tokenHash, usedAt: null, expiresAt: trusted({ $gt: now }) },
            { $set: { usedAt: now } },
          )
          .lean<LeanToken>();
        if (!doc) return null;
        return {
          id: doc._id.toHexString(),
          userId: doc.userId.toHexString(),
          tokenHash: doc.tokenHash,
          expiresAt: doc.expiresAt,
          usedAt: now,
        };
      },
      async invalidateAllForUser(kind, userId, now) {
        if (isId(userId)) {
          await tokenModel(kind).updateMany({ userId, usedAt: null }, { $set: { usedAt: now } });
        }
      },
    },

    loginAttempts: {
      async record({ email, success, ipAddress, at }) {
        await LoginAttempt.create({ email, success, ipAddress, createdAt: at });
      },
      async countFailedSince(email, since) {
        return LoginAttempt.countDocuments({
          email,
          success: false,
          createdAt: trusted({ $gte: since }),
        });
      },
      async clearFailed(email) {
        await LoginAttempt.deleteMany({ email, success: false });
      },
    },

    audit: {
      async insert(entry) {
        await AuditLog.create({
          action: entry.action,
          outcome: entry.outcome,
          actorId: optionalId(entry.actorId),
          organizationId: optionalId(entry.organizationId),
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          requestId: entry.requestId,
          ipAddress: entry.ipAddress,
          metadata: entry.metadata,
        });
      },
    },
  };
}
