import type { PasswordHasher } from '@impactalign/auth';
import { AuditEvent } from '@impactalign/types';
import { emailSchema, passwordSchema } from '@impactalign/validation';
import type { Repositories, UserRecord } from '../data/repositories';

/**
 * Creates the first SUPER_ADMIN (there is deliberately no HTTP endpoint for this). Refuses to touch an
 * existing account, so it cannot be used to take over or reset someone else's login.
 */
export async function createSuperAdmin(
  repos: Repositories,
  hasher: PasswordHasher,
  input: { email: string; password: string; displayName?: string },
): Promise<UserRecord> {
  const email = emailSchema.parse(input.email);
  const password = passwordSchema.parse(input.password);
  if (await repos.users.findByEmail(email))
    throw new Error('An account with this email already exists');

  const user = await repos.users.create({
    email,
    displayName: input.displayName ?? 'Super Admin',
    passwordHash: await hasher.hash(password),
    roles: ['SUPER_ADMIN'],
  });
  await repos.users.setEmailVerified(user.id, new Date());
  await repos.audit.insert({
    action: AuditEvent.ROLE_CHANGED,
    outcome: 'success',
    actorId: null,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { bootstrap: true, after: ['SUPER_ADMIN'] },
  });
  return { ...user, emailVerifiedAt: new Date() };
}
