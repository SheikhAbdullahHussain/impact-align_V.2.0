import { Types } from 'mongoose';
import { ContentEntry } from '@impactalign/database';
import type { ContentKind } from '@impactalign/types';
import type { ContentRecord, ContentRepository } from './repositories';

interface Lean {
  _id: Types.ObjectId;
  kind: string;
  key: string;
  status: string;
  data: unknown;
  publishedAt?: Date | null;
  updatedById?: Types.ObjectId | null;
  updatedAt: Date;
}

const toRecord = (d: Lean): ContentRecord => ({
  id: d._id.toHexString(),
  kind: d.kind as ContentKind,
  key: d.key,
  status: d.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  data: d.data,
  publishedAt: d.publishedAt ?? null,
  updatedById: d.updatedById?.toHexString() ?? null,
  updatedAt: d.updatedAt,
});

export class MongoContentRepository implements ContentRepository {
  async list(): Promise<ContentRecord[]> {
    const docs = await ContentEntry.find({}).sort({ kind: 1, key: 1 }).lean<Lean[]>();
    return docs.map(toRecord);
  }
  async find(kind: ContentKind, key: string): Promise<ContentRecord | null> {
    const doc = await ContentEntry.findOne({ kind, key }).lean<Lean>();
    return doc ? toRecord(doc) : null;
  }

  async upsert(
    kind: ContentKind,
    key: string,
    input: Parameters<ContentRepository['upsert']>[2],
  ): Promise<ContentRecord> {
    const doc = await ContentEntry.findOneAndUpdate(
      { kind, key },
      {
        $set: {
          status: input.status,
          data: input.data,
          publishedAt: input.publishedAt,
          updatedById: new Types.ObjectId(input.updatedById),
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean<Lean>();
    if (!doc) throw new Error('Content could not be saved');
    return toRecord(doc);
  }
}
