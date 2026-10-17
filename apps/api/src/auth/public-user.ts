import type { PublicUser } from '@impactalign/types';
import type { UserRecord } from '../data/repositories';

/** The only way a user leaves the API: no password hash, no internal fields. */
export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt.toISOString(),
  };
}
