import { AuditEvent, EDITABLE_PROJECT_STATUSES, type ProjectDto } from '@impactalign/types';
import type { ProjectInput } from '@impactalign/validation';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import type { ProjectRecord, Repositories, UserRecord } from '../data/repositories';

const ID_PATTERN = /^[a-f\d]{24}$/i;

export const toProjectDto = (p: ProjectRecord): ProjectDto => ({
  id: p.id,
  title: p.title,
  summary: p.summary,
  sdgNumbers: p.sdgNumbers,
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
 */
export class ProjectsService {
  constructor(private readonly deps: { repos: Repositories; audit: AuditService }) {}

  async create(actor: UserRecord, input: ProjectInput): Promise<ProjectDto> {
    const record = await this.deps.repos.projects.create({ ...input, ownerId: actor.id });
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
    const updated = await this.deps.repos.projects.update(project.id, input);
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
      throw new HttpError(400, 'SUBMISSION_INCOMPLETE', 'Select at least one SDG before submitting.');
    }
    if ((await repos.evidence.listByProject(project.id)).length === 0) {
      throw new HttpError(
        400,
        'SUBMISSION_INCOMPLETE',
        'Upload at least one evidence file before submitting.',
      );
    }
    const updated = await repos.projects.transition(
      project.id,
      project.status,
      'SUBMITTED',
      new Date(),
    );
    if (!updated) throw wrongState(notAllowed);
    await this.record(AuditEvent.PROJECT_SUBMITTED, actor, project.id, ctx);
    return toProjectDto(updated);
  }

  /** SUBMITTED -> DRAFT (only before a reviewer has picked it up). */
  async withdraw(actor: UserRecord, id: string, ctx: RequestContext): Promise<ProjectDto> {
    const project = await this.owned(actor, id);
    const notAllowed =
      'Only a submitted project that is not yet under review can be withdrawn.';
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