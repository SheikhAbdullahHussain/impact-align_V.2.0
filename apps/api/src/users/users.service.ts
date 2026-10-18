import { canAssignRoles, hasPlatformPermission } from '@impactalign/auth';
import { AuditEvent, Permission, type PlatformRole } from '@impactalign/types';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import type { Repositories, UserRecord } from '../data/repositories';

const forbidden = () => new HttpError(403, 'FORBIDDEN', 'You do not have permission to do this');

export class UsersService {
  constructor(private readonly deps: { repos: Repositories; audit: AuditService }) {}

  /** Your own profile, or anyone's when you hold USER_READ. Others get 403 (no existence probing). */
  async getUser(actor: UserRecord, targetId: string): Promise<UserRecord> {
    if (actor.id !== targetId && !hasPlatformPermission(actor.roles, Permission.USER_READ))
      throw forbidden();
    const user = await this.deps.repos.users.findById(targetId);
    if (!user) throw HttpError.notFound('User not found');
    return user;
  }

  /** Only the display name can be changed here; roles and email are never client-editable. */
  async updateOwnProfile(actor: UserRecord, displayName: string): Promise<UserRecord> {
    await this.deps.repos.users.setDisplayName(actor.id, displayName);
    return { ...actor, displayName };
  }

  async assignRoles(
    actor: UserRecord,
    targetId: string,
    requested: readonly PlatformRole[],
    ctx: RequestContext,
  ): Promise<UserRecord> {
    const { repos, audit } = this.deps;
    const target = await repos.users.findById(targetId);
    if (!target) throw HttpError.notFound('User not found');

    const roles = [...new Set(requested)];
    const before = [...target.roles]; // capture before anything changes
    const decision = canAssignRoles({
      actorId: actor.id,
      actorRoles: actor.roles,
      targetId: target.id,
      targetRoles: target.roles,
      newRoles: roles,
    });
    const base = {
      action: AuditEvent.ROLE_CHANGED,
      actorId: actor.id,
      resourceType: 'user',
      resourceId: target.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    };
    if (!decision.ok) {
      await audit.record({
        ...base,
        outcome: 'failure',
        metadata: { reason: decision.reason, requested: roles },
      });
      throw forbidden(); // the reason is logged, not revealed
    }
    await repos.users.setRoles(target.id, roles);
    await audit.record({ ...base, outcome: 'success', metadata: { before, after: roles } });
    return { ...target, roles };
  }
}
