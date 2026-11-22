import { hasOrganizationPermission } from '@impactalign/auth';
import {
  AuditEvent,
  EDITABLE_PROJECT_STATUSES,
  Permission,
  type ProjectDto,
} from '@impactalign/types';
import type { AlignmentInput, ProjectInput } from '@impactalign/validation';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import {
  DuplicateCodeError,
  type ProjectFields,
  type ProjectRecord,
  type Repositories,
  type UserRecord,
} from '../data/repositories';
import { generateSubmissionCode } from './submission-code';

const ID_PATTERN = /^[a-f\d]{24}$/i;
const CODE_ATTEMPTS = 5;

export const toProjectDto = (p: ProjectRecord): ProjectDto => ({
  id: p.id,
  title: p.title,
  summary: p.summary,
  sdgNumbers: p.sdgNumbers,
  submissionType: p.submissionType,
  organizationId: p.organizationId,
  code: p.code,
  targetIds: p.targetIds,
  indicatorIds: p.indicatorIds,
  status: p.status,
  submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

const locked = () =>
  new HttpError(409, 'PROJECT_LOCKED', 'A submitted project cannot be changed. Withdraw it first.');
const wrongState = (message: string) => new HttpError(409, 'INVALID_STATE', message);
const isEditable = (p: ProjectRecord) => EDITABLE_PROJECT_STATUSES.includes(p.status);

/**
 * Ownership rule: a project is reachable only by its owner. Anyone else gets the same 404 as for a
 * project that does not exist, so ids cannot be probed. The owner may change a project while it is
 * a draft or while a reviewer is waiting for clarification; only drafts can be deleted.
 * A project may be linked to an organization the owner belongs to; the link grants nobody else access.
 */
export class ProjectsService {
  constructor(private readonly deps: { repos: Repositories; audit: AuditService }) {}

  async create(actor: UserRecord, input: ProjectInput): Promise<ProjectDto> {
    const organizationId = input.organizationId ?? null;
    await this.checkOrganization(actor, organizationId);
    const fields: ProjectFields = {
      title: input.title,
      summary: input.summary,
      sdgNumbers: input.sdgNumbers,
      submissionType: input.submissionType ?? 'PROJECT_PROPOSAL',
      organizationId,
    };
    const record = await this.deps.repos.projects.create({ ...fields, ownerId: actor.id });
    return toProjectDto(record);
  }

  async listMine(actor: UserRecord): Promise<ProjectDto[]> {
    return (await this.deps.repos.projects.listByOwner(actor.id)).map(toProjectDto);
  }

  async get(actor: UserRecord, id: string): Promise<ProjectDto> {
    return toProjectDto(await this.owned(actor, id));
  }

  async update(actor: UserRecord, id: string, input: ProjectInput): Promise<ProjectDto> {
    const project = await this.owned(actor, id);
    if (!isEditable(project)) throw locked();
    const organizationId =
      input.organizationId === undefined ? project.organizationId : input.organizationId;
    if (organizationId !== project.organizationId) {
      await this.checkOrganization(actor, organizationId);
    }
    const fields: ProjectFields = {
      title: input.title,
      summary: input.summary,
      sdgNumbers: input.sdgNumbers,
      submissionType: input.submissionType ?? project.submissionType,
      organizationId,
    };
    await this.assertAlignmentCovered(project, fields.sdgNumbers);
    const updated = await this.deps.repos.projects.update(project.id, fields);
    if (!updated) throw HttpError.notFound('Project not found');
    return toProjectDto(updated);
  }

  async remove(actor: UserRecord, id: string): Promise<void> {
    const project = await this.owned(actor, id);
    if (project.status !== 'DRAFT') throw locked();
    await this.deps.repos.projects.softDelete(project.id);
  }

  /** DRAFT or CLARIFICATION_REQUIRED -> SUBMITTED. Needs at least one SDG and one evidence file. */
  async submit(actor: UserRecord, id: string, ctx: RequestContext): Promise<ProjectDto> {
    const { repos } = this.deps;
    const project = await this.owned(actor, id);
    const notAllowed = 'Only a draft or a project awaiting clarification can be submitted.';
    if (!isEditable(project)) throw wrongState(notAllowed);
    if (project.sdgNumbers.length === 0) {
      throw new HttpError(
        400,
        'SUBMISSION_INCOMPLETE',
        'Select at least one SDG before submitting.',
      );
    }
    if ((await repos.evidence.listByProject(project.id)).length === 0) {
      throw new HttpError(
        400,
        'SUBMISSION_INCOMPLETE',
        'Upload at least one evidence file before submitting.',
      );
    }
    await this.ensureCode(project);
    const updated = await repos.projects.transition(
      project.id,
      project.status,
      'SUBMITTED',
      new Date(),
    );
    if (!updated) throw wrongState(notAllowed);
    await this.deps.audit.record({
      action: AuditEvent.PROJECT_SUBMITTED,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'project',
      resourceId: project.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      metadata: { declaration: true, code: updated.code },
    });
    return toProjectDto(updated);
  }

  /** Maps the project to SDG targets and indicators from the catalogue (owner, while editable). */
  async setAlignment(actor: UserRecord, id: string, input: AlignmentInput): Promise<ProjectDto> {
    const { repos } = this.deps;
    const project = await this.owned(actor, id);
    if (!isEditable(project)) throw locked();
    const { targetIds, indicatorIds } = input;
    const [catalogue, targets, indicators] = await Promise.all([
      repos.sdgs.listSDGs(),
      repos.sdgs.findTargetsByIds(targetIds),
      repos.sdgs.findIndicatorsByIds(indicatorIds),
    ]);
    const invalid = (message: string) => new HttpError(400, 'INVALID_ALIGNMENT', message);
    if (targets.length !== targetIds.length || indicators.length !== indicatorIds.length) {
      throw invalid('Some selected targets or indicators do not exist.');
    }
    const numberOf = new Map(catalogue.map((sdg): [string, number] => [sdg.id, sdg.number]));
    const selected = (sdgId: string) => project.sdgNumbers.includes(numberOf.get(sdgId) ?? -1);
    if (!targets.every((t) => selected(t.sdgId)) || !indicators.every((i) => selected(i.sdgId))) {
      throw invalid('Targets and indicators must belong to the SDGs selected for this project.');
    }
    if (indicators.some((i) => i.targetId !== null && !targetIds.includes(i.targetId))) {
      throw invalid('Select the target of each indicator first.');
    }
    const updated = await repos.projects.setAlignment(project.id, targetIds, indicatorIds);
    if (!updated) throw HttpError.notFound('Project not found');
    await repos.evidence.unlinkExcept(project.id, indicatorIds);
    return toProjectDto(updated);
  }

  /** SUBMITTED -> DRAFT (only before a reviewer has picked it up). The code is kept. */
  async withdraw(actor: UserRecord, id: string, ctx: RequestContext): Promise<ProjectDto> {
    const project = await this.owned(actor, id);
    const notAllowed = 'Only a submitted project that is not yet under review can be withdrawn.';
    if (project.status !== 'SUBMITTED') throw wrongState(notAllowed);
    const updated = await this.deps.repos.projects.transition(
      project.id,
      'SUBMITTED',
      'DRAFT',
      null,
    );
    if (!updated) throw wrongState(notAllowed);
    await this.record(AuditEvent.PROJECT_WITHDRAWN, actor, project.id, ctx);
    return toProjectDto(updated);
  }

  /** An SDG cannot be deselected while targets or indicators of it are still mapped. */
  private async assertAlignmentCovered(
    project: ProjectRecord,
    sdgNumbers: number[],
  ): Promise<void> {
    if (project.targetIds.length + project.indicatorIds.length === 0) return;
    const { sdgs } = this.deps.repos;
    const [catalogue, targets, indicators] = await Promise.all([
      sdgs.listSDGs(),
      sdgs.findTargetsByIds(project.targetIds),
      sdgs.findIndicatorsByIds(project.indicatorIds),
    ]);
    const numberOf = new Map(catalogue.map((sdg): [string, number] => [sdg.id, sdg.number]));
    const stray = [...targets, ...indicators].some(
      (item) => !sdgNumbers.includes(numberOf.get(item.sdgId) ?? -1),
    );
    if (stray) {
      throw new HttpError(
        409,
        'ALIGNMENT_IN_USE',
        'Remove the mapped targets and indicators of an SDG before deselecting it.',
      );
    }
  }

  /** The IASDG code is issued once and then never changes. */
  private async ensureCode(project: ProjectRecord): Promise<void> {
    if (project.code) return;
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
      try {
        await this.deps.repos.projects.assignCode(project.id, generateSubmissionCode());
        return;
      } catch (err) {
        if (!(err instanceof DuplicateCodeError)) throw err;
      }
    }
    throw new HttpError(
      500,
      'CODE_GENERATION_FAILED',
      'Could not create a submission code. Try again.',
    );
  }

  /** Membership is the only way to link an organization. Strangers get the same 404 as a missing one. */
  private async checkOrganization(actor: UserRecord, organizationId: string | null): Promise<void> {
    if (organizationId === null) return;
    const { organizations } = this.deps.repos;
    const notFound = () => HttpError.notFound('Organization not found');
    if (!ID_PATTERN.test(organizationId)) throw notFound();
    const membership = await organizations.findMembership(organizationId, actor.id);
    if (!membership || !(await organizations.findById(organizationId))) throw notFound();
    if (!hasOrganizationPermission(membership.role, Permission.PROJECT_CREATE)) {
      throw new HttpError(403, 'FORBIDDEN', 'You do not have permission to do this');
    }
  }

  private record(
    action: typeof AuditEvent.PROJECT_SUBMITTED | typeof AuditEvent.PROJECT_WITHDRAWN,
    actor: UserRecord,
    projectId: string,
    ctx: RequestContext,
  ) {
    return this.deps.audit.record({
      action,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'project',
      resourceId: projectId,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
  }

  private async owned(actor: UserRecord, id: string): Promise<ProjectRecord> {
    const notFound = () => HttpError.notFound('Project not found');
    if (!ID_PATTERN.test(id)) throw notFound();
    const project = await this.deps.repos.projects.findById(id);
    if (!project || project.ownerId !== actor.id) throw notFound();
    return project;
  }
}
