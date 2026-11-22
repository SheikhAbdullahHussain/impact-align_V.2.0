import type { NewReport, ReportRecord, ReportRepository } from '../data/repositories';

export class MemoryReportRepository implements ReportRepository {
  private rows: ReportRecord[] = [];
  private seq = 0;

  async create(data: NewReport): Promise<ReportRecord> {
    const existing = this.rows.find((r) => r.projectId === data.projectId);
    if (existing) return existing;
    const record: ReportRecord = {
      ...data,
      id: (++this.seq).toString(16).padStart(24, '0'),
      createdAt: new Date(),
    };
    this.rows.push(record);
    return record;
  }

  async findByProject(projectId: string): Promise<ReportRecord | null> {
    return this.rows.find((r) => r.projectId === projectId) ?? null;
  }

  async listByOwner(ownerId: string): Promise<ReportRecord[]> {
    return this.rows.filter((r) => r.ownerId === ownerId).reverse();
  }
}
