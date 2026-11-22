import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../testing/memory-repositories';
import { ReportsService, ensureReport } from './reports.service';

const REVIEWER = 'a'.repeat(24);

async function setup(status: 'VERIFIED' | 'REJECTED' | 'SUBMITTED') {
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
  await repos.evidence.create({
    projectId: project.id,
    ownerId: owner.id,
    originalName: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 10,
    sha256: 'abc123',
    storageKey: 'key-1',
    indicatorId: null,
  });
  await repos.projects.transitionReview(project.id, 'DRAFT', status, REVIEWER);
  if (status !== 'SUBMITTED') {
    await repos.reviewNotes.create({
      projectId: project.id,
      authorId: REVIEWER,
      kind: status === 'VERIFIED' ? 'DECISION_VERIFIED' : 'DECISION_REJECTED',
      message: 'Looks good',
    });
  }
  return { repos, owner, projectId: project.id };
}

describe('ensureReport', () => {
  it('snapshots a verified project', async () => {
    const { repos, projectId } = await setup('VERIFIED');
    const project = (await repos.projects.findById(projectId))!;
    const report = await ensureReport(repos, project);
    expect(report).toMatchObject({
      code: 'IASDG-ABC123',
      title: 'Solar schools',
      sdgNumbers: [2, 13],
      decision: 'VERIFIED',
      rationale: 'Looks good',
    });
    expect(report?.evidence).toEqual([
      { fileName: 'plan.pdf', sha256: 'abc123', sizeBytes: 10, indicatorCode: null },
    ]);
  });

  it('is idempotent and keeps the original snapshot', async () => {
    const { repos, projectId } = await setup('REJECTED');
    const first = await ensureReport(repos, (await repos.projects.findById(projectId))!);
    await repos.projects.update(projectId, {
      submissionType: 'PROJECT_PROPOSAL',
      organizationId: null,
      title: 'Changed later',
      summary: '',
      sdgNumbers: [1],
    });
    const second = await ensureReport(repos, (await repos.projects.findById(projectId))!);
    expect(second?.id).toBe(first?.id);
    expect(second?.title).toBe('Solar schools');
    expect(second?.decision).toBe('REJECTED');
  });

  it('returns null while the project is not decided', async () => {
    const { repos, projectId } = await setup('SUBMITTED');
    expect(await ensureReport(repos, (await repos.projects.findById(projectId))!)).toBeNull();
  });
});

describe('ReportsService', () => {
  it('lets the owner read and list their report', async () => {
    const { repos, owner, projectId } = await setup('VERIFIED');
    const service = new ReportsService({ repos });
    const report = await service.getMine(owner.id, projectId);
    expect(report.code).toBe('IASDG-ABC123');
    expect(await service.listMine(owner.id)).toHaveLength(1);
  });

  it('hides the report from other users', async () => {
    const { repos, projectId } = await setup('VERIFIED');
    const service = new ReportsService({ repos });
    await expect(service.getMine('b'.repeat(24), projectId)).rejects.toThrow('Report not found');
    expect(await service.listMine('b'.repeat(24))).toEqual([]);
  });

  it('has no report for a project that is not decided', async () => {
    const { repos, owner, projectId } = await setup('SUBMITTED');
    await expect(new ReportsService({ repos }).getMine(owner.id, projectId)).rejects.toThrow(
      'Report not found',
    );
  });
});
