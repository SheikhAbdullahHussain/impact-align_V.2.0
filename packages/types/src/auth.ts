/** All user roles. Platform roles live on the user; organization roles live on a membership. */
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ASSESSOR: 'ASSESSOR',
  REVIEWER: 'REVIEWER',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  ORGANIZATION_MEMBER: 'ORGANIZATION_MEMBER',
  PROFESSIONAL: 'PROFESSIONAL',
  RESEARCHER: 'RESEARCHER',
  ACADEMIC: 'ACADEMIC',
  PARTNER: 'PARTNER',
  PUBLIC_USER: 'PUBLIC_USER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Roles assignable to a user account (platform-wide). */
export const PLATFORM_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ASSESSOR',
  'REVIEWER',
  'PROFESSIONAL',
  'RESEARCHER',
  'ACADEMIC',
  'PARTNER',
  'PUBLIC_USER',
] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Roles a user holds inside one organization (stored on the membership). */
export const ORGANIZATION_ROLES = ['ORGANIZATION_ADMIN', 'ORGANIZATION_MEMBER'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

/** The only roles a person may pick for themselves at registration. Never staff roles. */
export const SELF_REGISTRATION_ROLES = [
  'PROFESSIONAL',
  'RESEARCHER',
  'ACADEMIC',
  'PARTNER',
  'PUBLIC_USER',
] as const;
export type SelfRegistrationRole = (typeof SELF_REGISTRATION_ROLES)[number];

/** Permissions are separate from roles; roles are mapped to permissions in @impactalign/auth. */
export const Permission = {
  USER_READ: 'USER_READ',
  USER_UPDATE: 'USER_UPDATE',
  USER_ROLE_ASSIGN: 'USER_ROLE_ASSIGN',
  ORG_CREATE: 'ORG_CREATE',
  ORG_READ: 'ORG_READ',
  ORG_UPDATE: 'ORG_UPDATE',
  ORG_MEMBER_MANAGE: 'ORG_MEMBER_MANAGE',
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_READ: 'PROJECT_READ',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  EVIDENCE_UPLOAD: 'EVIDENCE_UPLOAD',
  EVIDENCE_SUBMIT: 'EVIDENCE_SUBMIT',
  ASSESSMENT_REVIEW: 'ASSESSMENT_REVIEW',
  ACCREDITATION_REVIEW: 'ACCREDITATION_REVIEW',
  AUDIT_READ: 'AUDIT_READ',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

/** Security-relevant events written to the audit log. */
export const AuditEvent = {
  USER_REGISTERED: 'USER_REGISTERED',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
} as const;
export type AuditEvent = (typeof AuditEvent)[keyof typeof AuditEvent];

/** User fields that are safe to send to a client. Never includes hashes or tokens. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  roles: PlatformRole[];
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
  /** Send back in the X-CSRF-Token header on state-changing requests. */
  csrfToken: string;
}

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  /** The caller's role in this organization. */
  role: OrganizationRole;
}

export interface OrganizationMemberView {
  userId: string;
  displayName: string;
  role: OrganizationRole;
}
