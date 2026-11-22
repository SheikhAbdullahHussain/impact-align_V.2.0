import { describe, expect, it } from 'vitest';
import type { AuditService } from '../auth/audit.service';
import { createMemoryRepositories } from '../testing/memory-repositories';
import { CertificatesService, ensureCertificate } from './certificates.service';

const REVIEWER = 'a'.repeat(24);
const audit = { record: async () => undefined } as unknown as AuditService;

async function setup() {
  const repos = createMemoryRepositories();
  const owner = await repos.users.create({
    email: 'owner@example.com',
    displayName: 'Owner',
    passwordHash: 'x',
    roles: ['PROFESSIONAL'],
  });
  const project = await repos.projects.create({
    ownerId: owner.id,
    submissionType: 'PROJECT_PROPOSAL',
    organizationId: null,
    title: 'Solar schools',
    summary: 'Summary',
    sdgNumbers: [13, 2],
  });
  await repos.projects.assignCode(project.id, 'IASDG-ABC123');
  await repos.projects.transitionReview(project.id, 'DRAFT', 'VERIFIED', REVIEWER);
  const verified = (await repos.projects.findById(project.id))!;
  const cert = (await ensureCertificate(repos, verified))!;
  return { repos, owner, projectId: project.id, cert };
}

describe('certificate PDF', () => {
  it('renders a PDF for a valid certificate', async () => {
    const { repos, owner, projectId } = await setup();
    const service = new CertificatesService({ repos, audit, webUrl: 'https://example.org' });
    const { data, fileName } = await service.getPdf(owner.id, projectId);
    expect(data.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(data.length).toBeGreaterThan(1000);
    expect(fileName).toMatch(/^CERT-\d{4}-[0-9A-F]{8}\.pdf$/);
  });

  it('refuses a revoked certificate', async () => {
    const { repos, owner, projectId, cert } = await setup();
    await repos.certificates.revoke(cert.id, new Date(), 'Forged evidence found.', REVIEWER);
    const service = new CertificatesService({ repos, audit });
    await expect(service.getPdf(owner.id, projectId)).rejects.toThrow(
      'Only a valid certificate can be downloaded.',
    );
  });

  it('does not give the PDF to another user', async () => {
    const { repos, projectId } = await setup();
    const service = new CertificatesService({ repos, audit });
    await expect(service.getPdf('b'.repeat(24), projectId)).rejects.toThrow(
      'Certificate not found',
    );
  });
});
