import { hasPlatformPermission } from '@impactalign/auth';
import {
  AuditEvent,
  Permission,
  type AssessmentDetailDto,
  type AssessmentQueueItemDto,
  type ProjectDto,
  type ProjectStatus,
  type ReviewNoteDto,
} from '@impactalign/types';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import type {
  EvidenceRecord,
  ProjectRecord,
  Repositories,
  ReviewNoteRecord,
  UserRecord,
} from '../data/repositories';
import { toDto as toEvidenceDto } from '../evidence/evidence.service';
import { toProjectDto } from '../projects/projects.service';
import type { FileStorage } from '../storage/file-storage';

const ID_PATTERN = /^[a-f\d]{24}$/i;
const QUEUE_STATUSES: ProjectStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED'];

const wrongState = (message: string) => new HttpError(409, 'INVALID_STATE', message);

const toNoteDto = (n: ReviewNoteRecord): ReviewNoteDto => ({
  id: n.id,
  kind: n.kind,
  message: n.message,
  createdAt: n.createdAt.toISOString(),
});

/**
 * Human review of submitted projects. Rules: nobody reviews their own project; only the assigned
 * reviewer acts on a project under review; the final decision needs ACCREDITATION_REVIEW and is
 * always made by a person (AI never decides).
 */
export class AssessmentsService {
  constructor(
    private readonly deps: { repos: Repositories; storage: FileStorage; audit: AuditService },
  ) {}

  async queue(actor: UserRecord): Promise<AssessmentQueueItemDto[]> {
    const { repos } = this.deps;
    const projects = (await repos.projects.listByStatus(QUEUE_STATUSES)).filter(
      (p) => p.ownerId !== actor.id,
    );
    const names = new Map<string, string>();
    for (const ownerId of new Set(projects.map((p) => p.ownerId))) {
      names.set(ownerId, (await repos.users.findById(ownerId))?.displayName ?? 'Unknown');
    }
    return projects.map((p) => ({
      project: toProjectDto(p),
      ownerName: names.get(p.ownerId) ?? 'Unknown',
      assignedToMe: p.reviewerId === actor.id,
    }));
  }

  async detail(actor: UserRecord, projectId: string): Promise<AssessmentDetailDto> {
    const { repos } = this.deps;
    const project = await this.reviewable(actor, projectId);
    const [evidence, notes, owner] = await Promise.all([
      repos.evidence.listByProject(project.id),
      repos.reviewNotes.listByProject(project.id),
      repos.users.findById(project.ownerId),
    ]);
    return {
      project: toProjectDto(project),
      ownerName: owner?.displayName ?? 'Unknown',
      evidence: evidence.map(toEvidenceDto),
      notes: notes.map(toNoteDto),
      assignedToMe: project.reviewerId === actor.id,
      canDecide: hasPlatformPermission(actor.roles, Permission.ACCREDITATION_REVIEW),
    };
  }

  /** SUBMITTED -> UNDER_REVIEW, assigned to the caller. Atomic: only one reviewer can win. */
  async start(actor: UserRecord, projectId: string, ctx: RequestContext): Promise<ProjectDto> {
    const project = await this.reviewable(actor, projectId);
    const notAllowed = 'Only a submitted project can be picked up for review.';
    if (project.status !== 'SUBMITTED') throw wrongState(notAllowed);
    const updated = await this.deps.repos.projects.transitionReview(
      project.id,
      'SUBMITTED',
      'UNDER_REVIEW',
      actor.id,
    );
    if (!updated) throw wrongState('This project was just picked up by another reviewer.');
    await this.audit(AuditEvent.ASSESSMENT_STARTED, actor, project.id, ctx);
    return toProjectDto(updated);
  }

  /** UNDER_REVIEW -> CLARIFICATION_REQUIRED. The owner can then edit and resubmit. */
  async requestClarification(
    actor: UserRecord,
    projectId: string,
    message: string,
    ctx: RequestContext,
  ): Promise<ProjectDto> {
    const { repos } = this.deps;
    const project = await this.assigned(actor, projectId);
    const updated = await repos.projects.transitionReview(
      project.id,
      'UNDER_REVIEW',
      'CLARIFICATION_REQUIRED',
      actor.id,
    );
    if (!updated) throw wrongState('The project must be under review.');
    await repos.reviewNotes.create({
      projectId: project.id,
      authorId: actor.id,
      kind: 'CLARIFICATION_REQUEST',
      message,
    });
    await this.audit(AuditEvent.CLARIFICATION_REQUESTED, actor, project.id, ctx);
    return toProjectDto(updated);
  }

  /** UNDER_REVIEW -> VERIFIED or REJECTED, with a written rationale. */
  async decide(
    actor: UserRecord,
    projectId: string,
    decision: 'VERIFIED' | 'REJECTED',
    rationale: string,
    ctx: RequestContext,
  ): Promise<ProjectDto> {
    const { repos } = this.deps;
    const project = await this.assigned(actor, projectId);
    const updated = await repos.projects.transitionReview(
      project.id,
      'UNDER_REVIEW',
      decision,
      actor.id,
    );
    if (!updated) throw wrongState('The project must be under review.');
    await repos.reviewNotes.create({
      projectId: project.id,
      authorId: actor.id,
      kind: decision === 'VERIFIED' ? 'DECISION_VERIFIED' : 'DECISION_REJECTED',
      message: rationale,
    });
    await this.audit(AuditEvent.DECISION_MADE, actor, project.id, ctx, { decision });
    return toProjectDto(updated);
  }

  async downloadEvidence(
    actor: UserRecord,
    projectId: string,
    evidenceId: string,
  ): Promise<{ record: EvidenceRecord; data: Buffer }> {
    const { repos, storage } = this.deps;
    const project = await this.reviewable(actor, projectId);
    const notFound = () => HttpError.notFound('Evidence not found');
    if (!ID_PATTERN.test(evidenceId)) throw notFound();
    const record = await repos.evidence.findById(evidenceId);
    if (!record || record.projectId !== project.id) throw notFound();
    const data = await storage.read(record.storageKey);
    if (!data) throw HttpError.notFound('File not found');
    return { record, data };
  }

  /** What the OWNER sees: reviewer messages and decisions on their own project. */
  async feedback(actor: UserRecord, projectId: string): Promise<ReviewNoteDto[]> {
    const { repos } = this.deps;
    const notFound = () => HttpError.notFound('Project not found');
    if (!ID_PATTERN.test(projectId)) throw notFound();
    const project = await repos.projects.findById(projectId);
    if (!project || project.ownerId !== actor.id) throw notFound();
    return (await repos.reviewNotes.listByProject(project.id)).map(toNoteDto);
  }

  private async reviewable(actor: UserRecord, id: string): Promise<ProjectRecord> {
    const notFound = () => HttpError.notFound('Project not found');
    if (!ID_PATTERN.test(id)) throw notFound();
    const project = await this.deps.repos.projects.findById(id);
    if (!project || project.status === 'DRAFT') throw notFound();
    if (project.ownerId === actor.id) {
      throw new HttpError(403, 'CONFLICT_OF_INTEREST', 'You cannot review your own project.');
    }
    return project;
  }

  private async assigned(actor: UserRecord, id: string): Promise<ProjectRecord> {
    const project = await this.reviewable(actor, id);
    if (project.status !== 'UNDER_REVIEW') throw wrongState('The project must be under review.');
    if (project.reviewerId !== actor.id) {
      throw new HttpError(403, 'NOT_ASSIGNED', 'Only the assigned reviewer can do this.');
    }
    return project;
  }

  private audit(
    action:
      | typeof AuditEvent.ASSESSMENT_STARTED
      | typeof AuditEvent.CLARIFICATION_REQUESTED
      | typeof AuditEvent.DECISION_MADE,
    actor: UserRecord,
    projectId: string,
    ctx: RequestContext,
    metadata?: Record<string, unknown>,
  ) {
    return this.deps.audit.record({
      action,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'project',
      resourceId: projectId,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      ...(metadata ? { metadata } : {}),
    });
  }
}