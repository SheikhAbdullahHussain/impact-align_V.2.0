import { randomBytes } from 'node:crypto';
import {
  AuditEvent,
  type CertificateDto,
  type CertificateStatus,
  type PublicVerificationDto,
} from '@impactalign/types';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import { renderCertificatePdf } from './certificate-pdf';
import type {
  CertificateRecord,
  ProjectRecord,
  Repositories,
  UserRecord,
} from '../data/repositories';

const ID_PATTERN = /^[a-f\d]{24}$/i;
export const DEFAULT_VALIDITY_MONTHS = 12;
const CODE_PATTERN = /^IASDG-[A-Z0-9]{6}$/;

export const certificateStatus = (c: CertificateRecord, now: Date): CertificateStatus => {
  if (c.revokedAt) return 'REVOKED';
  return c.expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'VALID';
};

export const toCertificateDto = (c: CertificateRecord, now: Date): CertificateDto => ({
  id: c.id,
  projectId: c.projectId,
  certificateNumber: c.certificateNumber,
  code: c.code,
  title: c.title,
  submissionType: c.submissionType,
  sdgNumbers: c.sdgNumbers,
  status: certificateStatus(c, now),
  issuedAt: c.issuedAt.toISOString(),
  expiresAt: c.expiresAt.toISOString(),
  revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
});

const addMonths = (from: Date, months: number): Date => {
  const d = new Date(from.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

const newNumber = (now: Date) =>
  `CERT-${now.getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;

/**
 * Issues the certificate for a VERIFIED project. Idempotent, so it is safe to call again.
 * Returns null while the project is not verified.
 */
export async function ensureCertificate(
  repos: Repositories,
  project: ProjectRecord,
  now: Date = new Date(),
  months: number = DEFAULT_VALIDITY_MONTHS,
): Promise<CertificateRecord | null> {
  const existing = await repos.certificates.findByProject(project.id);
  if (existing) return existing;
  if (project.status !== 'VERIFIED' || !project.code) return null;
  return repos.certificates.create({
    projectId: project.id,
    ownerId: project.ownerId,
    certificateNumber: newNumber(now),
    code: project.code,
    title: project.title,
    submissionType: project.submissionType,
    sdgNumbers: [...project.sdgNumbers].sort((a, b) => a - b),
    issuedAt: now,
    expiresAt: addMonths(now, months),
  });
}

export class CertificatesService {
  constructor(
    private readonly deps: {
      repos: Repositories;
      audit: AuditService;
      clock?: () => Date;
      webUrl?: string;
    },
  ) {}

  private now(): Date {
    return (this.deps.clock ?? (() => new Date()))();
  }

  /** Expired certificates move their VERIFIED project to EXPIRED (checked on read, no cron). */
  private async syncExpiry(cert: CertificateRecord, project: ProjectRecord | null) {
    if (!project || project.status !== 'VERIFIED') return;
    if (certificateStatus(cert, this.now()) !== 'EXPIRED') return;
    await this.deps.repos.projects.transition(
      project.id,
      'VERIFIED',
      'EXPIRED',
      project.submittedAt,
    );
  }

  async listMine(ownerId: string): Promise<CertificateDto[]> {
    const { repos } = this.deps;
    const now = this.now();
    const certs = await repos.certificates.listByOwner(ownerId);
    for (const cert of certs)
      await this.syncExpiry(cert, await repos.projects.findById(cert.projectId));
    return certs.map((c) => toCertificateDto(c, now));
  }

  async getMine(ownerId: string, projectId: string): Promise<CertificateDto> {
    const { repos } = this.deps;
    const notFound = () => HttpError.notFound('Certificate not found');
    if (!ID_PATTERN.test(projectId)) throw notFound();
    const project = await repos.projects.findById(projectId);
    if (!project || project.ownerId !== ownerId) throw notFound();
    const cert = await ensureCertificate(repos, project, this.now());
    if (!cert) throw notFound();
    await this.syncExpiry(cert, project);
    return toCertificateDto(cert, this.now());
  }

  /** ASSESSOR only (route guard): finds a certificate by its submission code. */
  async lookupByCode(rawCode: string): Promise<CertificateDto> {
    const notFound = () => HttpError.notFound('Certificate not found');
    const code = String(rawCode).trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) throw notFound();
    const cert = await this.deps.repos.certificates.findByCode(code);
    if (!cert) throw notFound();
    return toCertificateDto(cert, this.now());
  }

  /** Public, read-only. Invalid and unknown codes get the same answer. */
  async publicVerify(rawCode: string): Promise<PublicVerificationDto> {
    const notFound = () => HttpError.notFound('No certificate found for this code');
    const code = String(rawCode).trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) throw notFound();
    const cert = await this.deps.repos.certificates.findByCode(code);
    if (!cert) throw notFound();
    return {
      code: cert.code,
      certificateNumber: cert.certificateNumber,
      title: cert.title,
      submissionType: cert.submissionType,
      sdgNumbers: cert.sdgNumbers,
      status: certificateStatus(cert, this.now()),
      issuedAt: cert.issuedAt.toISOString(),
      expiresAt: cert.expiresAt.toISOString(),
      revokedAt: cert.revokedAt ? cert.revokedAt.toISOString() : null,
    };
  }

  /** The owner's PDF. Only a VALID certificate can be downloaded. */
  async getPdf(ownerId: string, projectId: string): Promise<{ data: Buffer; fileName: string }> {
    const cert = await this.getMine(ownerId, projectId);
    if (cert.status !== 'VALID') {
      throw new HttpError(409, 'INVALID_STATE', 'Only a valid certificate can be downloaded.');
    }
    const base = this.deps.webUrl ?? 'http://localhost:3000';
    const data = await renderCertificatePdf(cert, `${base}/verify/${cert.code}`);
    return { data, fileName: `${cert.certificateNumber}.pdf` };
  }

  /** ASSESSOR only (route guard). The reason stays internal. The project status does not change. */
  async revoke(
    actor: UserRecord,
    projectId: string,
    reason: string,
    ctx: RequestContext,
  ): Promise<CertificateDto> {
    const { repos } = this.deps;
    const notFound = () => HttpError.notFound('Certificate not found');
    if (!ID_PATTERN.test(projectId)) throw notFound();
    const trimmed = typeof reason === 'string' ? reason.trim() : '';
    if (trimmed.length < 10 || trimmed.length > 1000) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Give a reason of 10 to 1000 characters.');
    }
    const project = await repos.projects.findById(projectId);
    if (!project) throw notFound();
    if (project.ownerId === actor.id) {
      throw new HttpError(403, 'CONFLICT_OF_INTEREST', 'You cannot revoke your own certificate.');
    }
    const cert = await repos.certificates.findByProject(project.id);
    if (!cert) throw notFound();
    const revoked = await repos.certificates.revoke(cert.id, this.now(), trimmed, actor.id);
    if (!revoked) throw new HttpError(409, 'INVALID_STATE', 'This certificate is already revoked.');
    await this.deps.audit.record({
      action: AuditEvent.CERTIFICATE_REVOKED,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'project',
      resourceId: project.id,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
    });
    return toCertificateDto(revoked, this.now());
  }
}
