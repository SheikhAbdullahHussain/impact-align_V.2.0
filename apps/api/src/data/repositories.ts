// import type { AuditEvent, OrganizationRole, PlatformRole, ProjectStatus } from '@impactalign/types';
import type { AuditEvent, OrganizationRole, PlatformRole, ProjectStatus, ReviewNoteKind } from '@impactalign/types';
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

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}
export interface MembershipRecord {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}
export interface MemberRecord {
  userId: string;
  displayName: string;
  role: OrganizationRole;
}
export interface OrganizationRepository {
  create(data: { name: string; slug: string; createdById: string }): Promise<OrganizationRecord>;
  rename(id: string, name: string): Promise<void>;
  /** Removes an organization and its memberships (used only to undo a half-finished creation). */
  remove(id: string): Promise<void>;
  addMember(organizationId: string, userId: string, role: OrganizationRole): Promise<void>;
  findById(id: string): Promise<OrganizationRecord | null>;
  findMembership(organizationId: string, userId: string): Promise<MembershipRecord | null>;
  listForUser(
    userId: string,
  ): Promise<{ organization: OrganizationRecord; role: OrganizationRole }[]>;
  listMembers(organizationId: string): Promise<MemberRecord[]>;
}

export interface Repositories {
  users: UserRepository;
  sessions: SessionRepository;
  tokens: OneTimeTokenRepository;
  loginAttempts: LoginAttemptRepository;
  audit: AuditRepository;
  organizations: OrganizationRepository;
  sdgs: SdgRepository;
  projects: ProjectRepository;
  evidence: EvidenceRepository;
  reviewNotes: ReviewNoteRepository;
}

export interface SdgRecord {
  id: string;
  number: number;
  code: string;
  title: string | null;
  description: string | null;
  officialUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SdgTargetRecord {
  id: string;
  sdgId: string;
  code: string;
  title: string | null;
  description: string | null;
  officialUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SdgIndicatorRecord {
  id: string;
  sdgId: string;
  targetId: string | null;
  code: string;
  title: string | null;
  description: string | null;
  officialUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SdgRepository {
  listSDGs(): Promise<SdgRecord[]>;
  findSDGByNumber(number: number): Promise<SdgRecord | null>;
  listTargetsBySdgId(sdgId: string): Promise<SdgTargetRecord[]>;
  listIndicatorsBySdgId(sdgId: string): Promise<SdgIndicatorRecord[]>;
}

export interface ProjectRecord {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  sdgNumbers: number[];
  status: ProjectStatus;
  submittedAt: Date | null;
  reviewerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface ProjectFields {
  title: string;
  summary: string;
  sdgNumbers: number[];
}
export interface ProjectRepository {
  create(data: ProjectFields & { ownerId: string }): Promise<ProjectRecord>;
  /** Newest first. Soft-deleted projects are never returned. */
  listByOwner(ownerId: string): Promise<ProjectRecord[]>;
  findById(id: string): Promise<ProjectRecord | null>;
  update(id: string, data: ProjectFields): Promise<ProjectRecord | null>;
  softDelete(id: string): Promise<void>;
    /** Atomic compare-and-set: moves the project only if it is currently in `from`. */
  transition(
    id: string,
    from: ProjectStatus,
    to: ProjectStatus,
    submittedAt: Date | null,
  ): Promise<ProjectRecord | null>;
    
  /** Projects in any of the given statuses, oldest submission first (reviewer queue). */
    listByStatus(statuses: ProjectStatus[]): Promise<ProjectRecord[]>;
    /** Atomic review step: moves the project only if it is in `from`, and sets the reviewer. */
    transitionReview(
      id: string,
      from: ProjectStatus,
      to: ProjectStatus,
      reviewerId: string | null,
    ): Promise<ProjectRecord | null>;
}
export interface EvidenceRecord {
  id: string;
  projectId: string;
  ownerId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  createdAt: Date;
}
export type NewEvidence = Omit<EvidenceRecord, 'id' | 'createdAt'>;
export interface EvidenceRepository {
  create(data: NewEvidence): Promise<EvidenceRecord>;
  /** Newest first. Soft-deleted rows are never returned. */
  listByProject(projectId: string): Promise<EvidenceRecord[]>;
  findById(id: string): Promise<EvidenceRecord | null>;
  softDelete(id: string): Promise<void>;
}

export interface ReviewNoteRecord {
  id: string;
  projectId: string;
  authorId: string;
  kind: ReviewNoteKind;
  message: string;
  createdAt: Date;
}
export interface ReviewNoteRepository {
  create(data: Omit<ReviewNoteRecord, 'id' | 'createdAt'>): Promise<ReviewNoteRecord>;
  /** Oldest first. */
  listByProject(projectId: string): Promise<ReviewNoteRecord[]>;
}