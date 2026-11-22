import { Types } from 'mongoose';
import { Certificate } from '@impactalign/database';
import type { CertificateRecord, CertificateRepository, NewCertificate } from './repositories';

interface Lean {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  ownerId: Types.ObjectId;
  certificateNumber: string;
  code: string;
  title: string;
  submissionType: string;
  sdgNumbers?: number[];
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  revokedById?: Types.ObjectId | null;
  createdAt: Date;
}

const toRecord = (d: Lean): CertificateRecord => ({
  id: d._id.toHexString(),
  projectId: d.projectId.toHexString(),
  ownerId: d.ownerId.toHexString(),
  certificateNumber: d.certificateNumber,
  code: d.code,
  title: d.title,
  submissionType: d.submissionType as CertificateRecord['submissionType'],
  sdgNumbers: d.sdgNumbers ?? [],
  issuedAt: d.issuedAt,
  expiresAt: d.expiresAt,
  revokedAt: d.revokedAt ?? null,
  revokedReason: d.revokedReason ?? null,
  revokedById: d.revokedById?.toHexString() ?? null,
  createdAt: d.createdAt,
});

const isId = (id: string): boolean =>
  Types.ObjectId.isValid(id) && new Types.ObjectId(id).toHexString() === id;

export class MongoCertificateRepository implements CertificateRepository {
  async create(data: NewCertificate): Promise<CertificateRecord> {
    const doc = await Certificate.findOneAndUpdate(
      { projectId: new Types.ObjectId(data.projectId) },
      {
        $setOnInsert: {
          ...data,
          projectId: new Types.ObjectId(data.projectId),
          ownerId: new Types.ObjectId(data.ownerId),
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean<Lean>();
    if (!doc) throw new Error('Certificate could not be created');
    return toRecord(doc);
  }

  async findByProject(projectId: string): Promise<CertificateRecord | null> {
    if (!isId(projectId)) return null;
    const doc = await Certificate.findOne({ projectId }).lean<Lean>();
    return doc ? toRecord(doc) : null;
  }

  async findByCode(code: string): Promise<CertificateRecord | null> {
    const doc = await Certificate.findOne({ code }).lean<Lean>();
    return doc ? toRecord(doc) : null;
  }

  async listByOwner(ownerId: string): Promise<CertificateRecord[]> {
    if (!isId(ownerId)) return [];
    const docs = await Certificate.find({ ownerId }).sort({ createdAt: -1 }).lean<Lean[]>();
    return docs.map(toRecord);
  }

  async revoke(
    id: string,
    at: Date,
    reason: string,
    byId: string,
  ): Promise<CertificateRecord | null> {
    if (!isId(id) || !isId(byId)) return null;
    const doc = await Certificate.findOneAndUpdate(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: at, revokedReason: reason, revokedById: new Types.ObjectId(byId) } },
      { returnDocument: 'after' },
    ).lean<Lean>();
    return doc ? toRecord(doc) : null;
  }
}
