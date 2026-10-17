import { Permission, type OrganizationRole, type PlatformRole } from '@impactalign/types';

const P = Permission;

/**
 * Platform-wide permissions per role. Deliberately NO organization data permissions for ADMIN:
 * platform staff do not get blanket access to organizations' private data (isolation rule).
 */
export const platformRolePermissions: Readonly<Record<PlatformRole, readonly Permission[]>> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: [P.ADMIN_ACCESS, P.USER_READ, P.USER_UPDATE, P.USER_ROLE_ASSIGN, P.AUDIT_READ],
  ASSESSOR: [P.ASSESSMENT_REVIEW, P.ACCREDITATION_REVIEW],
  REVIEWER: [P.ASSESSMENT_REVIEW],
  PROFESSIONAL: [
    P.ORG_CREATE,
    P.PROJECT_CREATE,
    P.PROJECT_READ,
    P.PROJECT_UPDATE,
    P.EVIDENCE_UPLOAD,
    P.EVIDENCE_SUBMIT,
  ],
  RESEARCHER: [
    P.ORG_CREATE,
    P.PROJECT_CREATE,
    P.PROJECT_READ,
    P.PROJECT_UPDATE,
    P.EVIDENCE_UPLOAD,
    P.EVIDENCE_SUBMIT,
  ],
  ACADEMIC: [
    P.ORG_CREATE,
    P.PROJECT_CREATE,
    P.PROJECT_READ,
    P.PROJECT_UPDATE,
    P.EVIDENCE_UPLOAD,
    P.EVIDENCE_SUBMIT,
  ],
  PARTNER: [P.ORG_CREATE],
  PUBLIC_USER: [],
};

/** Permissions a member holds inside ONE organization (never applies to other organizations). */
export const organizationRolePermissions: Readonly<
  Record<OrganizationRole, readonly Permission[]>
> = {
  ORGANIZATION_ADMIN: [
    P.ORG_READ,
    P.ORG_UPDATE,
    P.ORG_MEMBER_MANAGE,
    P.PROJECT_CREATE,
    P.PROJECT_READ,
    P.PROJECT_UPDATE,
    P.EVIDENCE_UPLOAD,
    P.EVIDENCE_SUBMIT,
  ],
  ORGANIZATION_MEMBER: [
    P.ORG_READ,
    P.PROJECT_CREATE,
    P.PROJECT_READ,
    P.PROJECT_UPDATE,
    P.EVIDENCE_UPLOAD,
  ],
};

export function hasPlatformPermission(
  roles: readonly PlatformRole[],
  permission: Permission,
): boolean {
  return roles.some((role) => platformRolePermissions[role]?.includes(permission) === true);
}

export function hasOrganizationPermission(role: OrganizationRole, permission: Permission): boolean {
  return organizationRolePermissions[role]?.includes(permission) === true;
}

const STAFF_ROLES: readonly PlatformRole[] = ['SUPER_ADMIN', 'ADMIN'];
const isStaff = (roles: readonly PlatformRole[]) => roles.some((r) => STAFF_ROLES.includes(r));

export type RoleAssignmentDecision = { ok: true } | { ok: false; reason: string };

export interface RoleAssignmentRequest {
  readonly actorId: string;
  readonly actorRoles: readonly PlatformRole[];
  readonly targetId: string;
  readonly targetRoles: readonly PlatformRole[];
  readonly newRoles: readonly PlatformRole[];
}

/**
 * Privilege-escalation rules for changing someone's platform roles:
 *  - the actor needs USER_ROLE_ASSIGN;
 *  - nobody changes their own roles;
 *  - only SUPER_ADMIN may grant or revoke ADMIN/SUPER_ADMIN, or modify a staff account.
 */
export function canAssignRoles(request: RoleAssignmentRequest): RoleAssignmentDecision {
  const { actorId, actorRoles, targetId, targetRoles, newRoles } = request;
  if (!hasPlatformPermission(actorRoles, Permission.USER_ROLE_ASSIGN)) {
    return { ok: false, reason: 'missing_permission' };
  }
  if (actorId === targetId) return { ok: false, reason: 'cannot_change_own_roles' };

  const actorIsSuper = actorRoles.includes('SUPER_ADMIN');
  if (!actorIsSuper) {
    if (isStaff(targetRoles)) return { ok: false, reason: 'target_is_staff' };
    if (isStaff(newRoles)) return { ok: false, reason: 'cannot_grant_staff_role' };
  }
  return { ok: true };
}
