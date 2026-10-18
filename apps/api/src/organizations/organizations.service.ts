import { randomBytes } from 'node:crypto';
import { hasOrganizationPermission } from '@impactalign/auth';
import {
  AuditEvent,
  Permission,
  type OrganizationMemberView,
  type OrganizationRole,
  type PublicOrganization,
} from '@impactalign/types';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import type { OrganizationRecord, Repositories, UserRecord } from '../data/repositories';

const ID_PATTERN = /^[a-f\d]{24}$/i;

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'organization';

const view = (org: OrganizationRecord, role: OrganizationRole): PublicOrganization => ({
  id: org.id,
  name: org.name,
  slug: org.slug,
  createdAt: org.createdAt.toISOString(),
  role,
});

/**
 * Organization isolation: membership is the ONLY way to reach an organization's data. A non-member
 * gets the same 404 as for an organization that does not exist, so nothing can be probed, and
 * platform roles (even SUPER_ADMIN) grant no access through these routes.
 */
export class OrganizationsService {
  constructor(private readonly deps: { repos: Repositories; audit: AuditService }) {}

  async create(actor: UserRecord, name: string, ctx: RequestContext): Promise<PublicOrganization> {
    const { repos, audit } = this.deps;
    const org = await repos.organizations.create({
      name,
      slug: `${slugify(name)}-${randomBytes(3).toString('hex')}`,
      createdById: actor.id,
    });
    try {
      await repos.organizations.addMember(org.id, actor.id, 'ORGANIZATION_ADMIN');
    } catch (err) {
      await repos.organizations.remove(org.id); // no organization without an admin
      throw err;
    }
    await audit.record({
      action: AuditEvent.ORGANIZATION_CREATED,
      outcome: 'success',
      actorId: actor.id,
      organizationId: org.id,
      resourceType: 'organization',
      resourceId: org.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
    return view(org, 'ORGANIZATION_ADMIN');
  }

  async listMine(actor: UserRecord): Promise<PublicOrganization[]> {
    const rows = await this.deps.repos.organizations.listForUser(actor.id);
    return rows.map((row) => view(row.organization, row.role));
  }

  async get(actor: UserRecord, orgId: string): Promise<PublicOrganization> {
    const { org, role } = await this.access(actor, orgId, Permission.ORG_READ);
    return view(org, role);
  }

  /** Display names and roles only: never email addresses. */
  async listMembers(actor: UserRecord, orgId: string): Promise<OrganizationMemberView[]> {
    await this.access(actor, orgId, Permission.ORG_READ);
    return this.deps.repos.organizations.listMembers(orgId);
  }

  async rename(actor: UserRecord, orgId: string, name: string): Promise<PublicOrganization> {
    const { org, role } = await this.access(actor, orgId, Permission.ORG_UPDATE);
    await this.deps.repos.organizations.rename(org.id, name);
    return view({ ...org, name }, role);
  }

  private async access(actor: UserRecord, orgId: string, permission: Permission) {
    const notFound = () => HttpError.notFound('Organization not found');
    if (!ID_PATTERN.test(orgId)) throw notFound();
    const membership = await this.deps.repos.organizations.findMembership(orgId, actor.id);
    if (!membership) throw notFound();
    const org = await this.deps.repos.organizations.findById(orgId);
    if (!org) throw notFound();
    if (!hasOrganizationPermission(membership.role, permission)) {
      throw new HttpError(403, 'FORBIDDEN', 'You do not have permission to do this');
    }
    return { org, role: membership.role };
  }
}
