import { Report, type ReportDocument } from '@impactalign/database';
import type { NewReport, ReportRecord, ReportRepository } from './repositories';

type Lean = ReportDocument & { _id: { toString(): string }; createdAt: Date };

const toRecord = (d: Lean): ReportRecord => ({
  id: d._id.toString(),
  projectId: d.projectId.toString(),
  ownerId: d.ownerId.toString(),
  code: d.code,
  title: d.title,
  submissionType: d.submissionType as ReportRecord['submissionType'],
  sdgNumbers: [...d.sdgNumbers],
  targets: d.targets.map((t) => ({ code: t.code, title: t.title ?? null })),
  indicators: d.indicators.map((t) => ({ code: t.code, title: t.title ?? null })),
  evidence: d.evidence.map((e) => ({
    fileName: e.fileName,
    sha256: e.sha256,
    sizeBytes: e.sizeBytes,
    indicatorCode: e.indicatorCode ?? null,
  })),
  decision: d.decision as ReportRecord['decision'],
  rationale: d.rationale,
  decidedAt: d.decidedAt,
  reviewerId: d.reviewerId ? d.reviewerId.toString() : null,
  createdAt: d.createdAt,
});

export class MongoReportRepository implements ReportRepository {
  async create(data: NewReport): Promise<ReportRecord> {
    const doc = await Report.findOneAndUpdate(
      { projectId: data.projectId },
      { $setOnInsert: data },
      { upsert: true, new: true, lean: true },
    );
    if (!doc) throw new Error('Report could not be created');
    return toRecord(doc as unknown as Lean);
  }

  async findByProject(projectId: string): Promise<ReportRecord | null> {
    const doc = await Report.findOne({ projectId }).lean();
    return doc ? toRecord(doc as unknown as Lean) : null;
  }

  async listByOwner(ownerId: string): Promise<ReportRecord[]> {
    const docs = await Report.find({ ownerId }).sort({ createdAt: -1 }).lean();
    return docs.map((d) => toRecord(d as unknown as Lean));
  }
}
