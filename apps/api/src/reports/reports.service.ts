import type { AssessmentReportDto } from '@impactalign/types';
import { HttpError } from '../common/http-error';
import type { ProjectRecord, Repositories, ReportRecord } from '../data/repositories';

const ID_PATTERN = /^[a-f\d]{24}$/i;

export const toReportDto = (r: ReportRecord): AssessmentReportDto => ({
  id: r.id,
  projectId: r.projectId,
  code: r.code,
  title: r.title,
  submissionType: r.submissionType,
  sdgNumbers: r.sdgNumbers,
  targets: r.targets,
  indicators: r.indicators,
  evidence: r.evidence,
  decision: r.decision,
  rationale: r.rationale,
  decidedAt: r.decidedAt.toISOString(),
  createdAt: r.createdAt.toISOString(),
});

/**
 * Creates the immutable report for a decided project (VERIFIED / REJECTED). Idempotent, so it is
 * safe to call again if an earlier attempt failed. Returns null while the project is not decided.
 */
export async function ensureReport(
  repos: Repositories,
  project: ProjectRecord,
): Promise<ReportRecord | null> {
  if (project.status !== 'VERIFIED' && project.status !== 'REJECTED') return null;
  const existing = await repos.reports.findByProject(project.id);
  if (existing) return existing;

  const notes = await repos.reviewNotes.listByProject(project.id);
  const note = [...notes]
    .reverse()
    .find((n) => n.kind === 'DECISION_VERIFIED' || n.kind === 'DECISION_REJECTED');
  if (!note || !project.code) return null;

  const [targets, indicators, evidence] = await Promise.all([
    repos.sdgs.findTargetsByIds(project.targetIds),
    repos.sdgs.findIndicatorsByIds(project.indicatorIds),
    repos.evidence.listByProject(project.id),
  ]);
  const indicatorCode = new Map(indicators.map((i) => [i.id, i.code]));

  return repos.reports.create({
    projectId: project.id,
    ownerId: project.ownerId,
    code: project.code,
    title: project.title,
    submissionType: project.submissionType,
    sdgNumbers: [...project.sdgNumbers].sort((a, b) => a - b),
    targets: targets.map((t) => ({ code: t.code, title: t.title })),
    indicators: indicators.map((i) => ({ code: i.code, title: i.title })),
    evidence: evidence.map((e) => ({
      fileName: e.originalName,
      sha256: e.sha256,
      sizeBytes: e.sizeBytes,
      indicatorCode: e.indicatorId ? (indicatorCode.get(e.indicatorId) ?? null) : null,
    })),
    decision: project.status,
    rationale: note.message,
    decidedAt: note.createdAt,
    reviewerId: project.reviewerId,
  });
}

/** What the OWNER sees: reports of their own decided projects. */
export class ReportsService {
  constructor(private readonly deps: { repos: Repositories }) {}

  async listMine(ownerId: string): Promise<AssessmentReportDto[]> {
    return (await this.deps.repos.reports.listByOwner(ownerId)).map(toReportDto);
  }

  async getMine(ownerId: string, projectId: string): Promise<AssessmentReportDto> {
    const { repos } = this.deps;
    const notFound = () => HttpError.notFound('Report not found');
    if (!ID_PATTERN.test(projectId)) throw notFound();
    const project = await repos.projects.findById(projectId);
    if (!project || project.ownerId !== ownerId) throw notFound();
    const report = await ensureReport(repos, project);
    if (!report) throw notFound();
    return toReportDto(report);
  }
}
