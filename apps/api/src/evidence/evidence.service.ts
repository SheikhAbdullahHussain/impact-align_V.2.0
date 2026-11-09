import { createHash, randomUUID } from 'node:crypto';
import { AuditEvent, EDITABLE_PROJECT_STATUSES, type EvidenceDto } from '@impactalign/types';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import type { EvidenceRecord, ProjectRecord, Repositories, UserRecord } from '../data/repositories';
import type { FileStorage } from '../storage/file-storage';
import { checkEvidenceFile } from './file-validation';

const ID_PATTERN = /^[a-f\d]{24}$/i;

export const toDto = (e: EvidenceRecord): EvidenceDto => ({
  id: e.id,
  projectId: e.projectId,
  fileName: e.originalName,
  mimeType: e.mimeType,
  sizeBytes: e.sizeBytes,
  sha256: e.sha256,
  createdAt: e.createdAt.toISOString(),
});

/** Evidence is reachable only through a project the caller owns; everything else is a 404. */
export class EvidenceService {
  constructor(
    private readonly deps: { repos: Repositories; storage: FileStorage; audit: AuditService },
  ) {}

  async upload(
    actor: UserRecord,
    projectId: string,
    rawName: string,
    content: Buffer,
    ctx: RequestContext,
  ): Promise<EvidenceDto> {
    const { repos, storage, audit } = this.deps;
    const project = await this.project(actor, projectId);
    this.assertEditable(project);
    const check = checkEvidenceFile(rawName, content);
    if (!check.ok) throw new HttpError(400, 'INVALID_FILE', check.reason);

    const storageKey = randomUUID();
    await storage.save(storageKey, content);
    let record: EvidenceRecord;
    try {
      record = await repos.evidence.create({
        projectId: project.id,
        ownerId: actor.id,
        originalName: check.name,
        mimeType: check.mime,
        sizeBytes: content.length,
        sha256: createHash('sha256').update(content).digest('hex'),
        storageKey,
      });
    } catch (err) {
      await storage.remove(storageKey); // no orphaned file without a record
      throw err;
    }
    await audit.record({
      action: AuditEvent.EVIDENCE_UPLOADED,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'evidence',
      resourceId: record.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      metadata: { projectId: project.id, mimeType: check.mime, sizeBytes: content.length },
    });
    return toDto(record);
  }

  async list(actor: UserRecord, projectId: string): Promise<EvidenceDto[]> {
    const project = await this.project(actor, projectId);
    return (await this.deps.repos.evidence.listByProject(project.id)).map(toDto);
  }

  async download(
    actor: UserRecord,
    projectId: string,
    evidenceId: string,
  ): Promise<{ record: EvidenceRecord; data: Buffer }> {
    const record = await this.evidence(actor, projectId, evidenceId);
    const data = await this.deps.storage.read(record.storageKey);
    if (!data) throw HttpError.notFound('File not found');
    return { record, data };
  }

  async remove(
    actor: UserRecord,
    projectId: string,
    evidenceId: string,
    ctx: RequestContext,
  ): Promise<void> {
    this.assertEditable(await this.project(actor, projectId));
    const record = await this.evidence(actor, projectId, evidenceId);
    await this.deps.repos.evidence.softDelete(record.id);
    await this.deps.storage.remove(record.storageKey);
    await this.deps.audit.record({
      action: AuditEvent.EVIDENCE_DELETED,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'evidence',
      resourceId: record.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      metadata: { projectId: record.projectId },
    });
  }

  private assertEditable(project: ProjectRecord): void {
    if (!EDITABLE_PROJECT_STATUSES.includes(project.status)) {
      throw new HttpError(
        409,
        'PROJECT_LOCKED',
        'A submitted project cannot be changed. Withdraw it first.',
      );
    }
  }

  private async project(actor: UserRecord, id: string): Promise<ProjectRecord> {
    const notFound = () => HttpError.notFound('Project not found');
    if (!ID_PATTERN.test(id)) throw notFound();
    const project = await this.deps.repos.projects.findById(id);
    if (!project || project.ownerId !== actor.id) throw notFound();
    return project;
  }

  private async evidence(
    actor: UserRecord,
    projectId: string,
    evidenceId: string,
  ): Promise<EvidenceRecord> {
    const project = await this.project(actor, projectId);
    const notFound = () => HttpError.notFound('Evidence not found');
    if (!ID_PATTERN.test(evidenceId)) throw notFound();
    const record = await this.deps.repos.evidence.findById(evidenceId);
    if (!record || record.projectId !== project.id) throw notFound();
    return record;
  }
}