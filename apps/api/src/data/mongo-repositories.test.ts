import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmailVerification, LoginAttempt, Session, User } from '@impactalign/database';
import { DuplicateEmailError } from './repositories';
import { createMongoRepositories } from './mongo-repositories';

afterEach(() => vi.restoreAllMocks());

const resolved = (value: unknown) => (() => Promise.resolve(value)) as never;
const hasTrustedOperator = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && Object.getOwnPropertySymbols(value).length > 0;

describe('mongo repositories (query contracts; the live database is exercised by the smoke test)', () => {
  it('does not query when an id is not a valid ObjectId', async () => {
    const spy = vi.spyOn(User, 'findOne');
    const repos = createMongoRepositories();
    expect(await repos.users.findById('not-an-id')).toBeNull();
    expect(await repos.users.findById('123456789012')).toBeNull(); // 12 chars: valid for Mongoose, not for us
    expect(await repos.sessions.revokeAllForUser('nope', new Date())).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps a duplicate-key error to DuplicateEmailError', async () => {
    vi.spyOn(User, 'create').mockImplementation((() => Promise.reject({ code: 11000 })) as never);
    await expect(
      createMongoRepositories().users.create({
        email: 'a@b.co',
        displayName: 'Ab',
        passwordHash: 'h',
        roles: ['PUBLIC_USER'],
      }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it('consumes a one-time token atomically, with trusted operators and a null usedAt guard', async () => {
    const spy = vi
      .spyOn(EmailVerification, 'findOneAndUpdate')
      .mockImplementation((() => ({ lean: () => Promise.resolve(null) })) as never);
    const result = await createMongoRepositories().tokens.consume(
      'email_verification',
      'hash',
      new Date(),
    );
    expect(result).toBeNull();
    const filter = spy.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(filter['usedAt']).toBeNull();
    expect(filter['tokenHash']).toBe('hash');
    expect(hasTrustedOperator(filter['expiresAt'])).toBe(true);
  });

  it('counts only failed attempts inside the window, with a trusted operator', async () => {
    const spy = vi.spyOn(LoginAttempt, 'countDocuments').mockImplementation(resolved(3));
    expect(
      await createMongoRepositories().loginAttempts.countFailedSince('a@b.co', new Date()),
    ).toBe(3);
    const filter = spy.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(filter['success']).toBe(false);
    expect(hasTrustedOperator(filter['createdAt'])).toBe(true);
  });

  it('revokes every other session but keeps the excepted one (trusted $ne)', async () => {
    const spy = vi.spyOn(Session, 'updateMany').mockImplementation(resolved({ modifiedCount: 2 }));
    const keep = new Types.ObjectId().toHexString();
    const user = new Types.ObjectId().toHexString();
    expect(await createMongoRepositories().sessions.revokeAllForUser(user, new Date(), keep)).toBe(
      2,
    );
    const filter = spy.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(filter['revokedAt']).toBeNull();
    expect(hasTrustedOperator(filter['_id'])).toBe(true);
  });
});
