import { randomBytes } from 'node:crypto';
import type {
  CertificateRecord,
  CertificateRepository,
  NewCertificate,
} from '../data/repositories';

export class MemoryCertificateRepository implements CertificateRepository {
  rows: CertificateRecord[] = [];

  async create(data: NewCertificate): Promise<CertificateRecord> {
    const existing = this.rows.find((r) => r.projectId === data.projectId);
    if (existing) return { ...existing };
    const record: CertificateRecord = {
      ...data,
      id: randomBytes(12).toString('hex'),
      revokedAt: null,
      revokedReason: null,
      revokedById: null,
      createdAt: new Date(),
    };
    this.rows.push(record);
    return { ...record };
  }

  async findByProject(projectId: string): Promise<CertificateRecord | null> {
    const found = this.rows.find((r) => r.projectId === projectId);
    return found ? { ...found } : null;
  }

  async findByCode(code: string): Promise<CertificateRecord | null> {
    const found = this.rows.find((r) => r.code === code);
    return found ? { ...found } : null;
  }

  async listByOwner(ownerId: string): Promise<CertificateRecord[]> {
    return this.rows
      .filter((r) => r.ownerId === ownerId)
      .reverse()
      .map((r) => ({ ...r }));
  }

  async revoke(
    id: string,
    at: Date,
    reason: string,
    byId: string,
  ): Promise<CertificateRecord | null> {
    const found = this.rows.find((r) => r.id === id && !r.revokedAt);
    if (!found) return null;
    Object.assign(found, { revokedAt: at, revokedReason: reason, revokedById: byId });
    return { ...found };
  }
}
