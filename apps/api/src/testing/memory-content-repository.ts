import { randomBytes } from 'node:crypto';
import type { ContentKind } from '@impactalign/types';
import type { ContentRecord, ContentRepository } from '../data/repositories';

export class MemoryContentRepository implements ContentRepository {
  rows: ContentRecord[] = [];

  async list(): Promise<ContentRecord[]> {
    return this.rows.map((r) => ({ ...r }));
  }

  async find(kind: ContentKind, key: string): Promise<ContentRecord | null> {
    const found = this.rows.find((r) => r.kind === kind && r.key === key);
    return found ? { ...found } : null;
  }

  async upsert(
    kind: ContentKind,
    key: string,
    input: Parameters<ContentRepository['upsert']>[2],
  ): Promise<ContentRecord> {
    const existing = this.rows.find((r) => r.kind === kind && r.key === key);
    if (existing) {
      Object.assign(existing, { ...input, updatedAt: new Date() });
      return { ...existing };
    }
    const record: ContentRecord = {
      id: randomBytes(12).toString('hex'),
      kind,
      key,
      ...input,
      updatedAt: new Date(),
    };
    this.rows.push(record);
    return { ...record };
  }
}
