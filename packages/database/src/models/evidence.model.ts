import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const evidenceSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 120 },
    mimeType: { type: String, required: true, maxlength: 120 },
    sizeBytes: { type: Number, required: true, min: 1 },
    sha256: { type: String, required: true, maxlength: 64 },
    /** Random name of the stored file. Never exposed to clients. */
    storageKey: { type: String, required: true, unique: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type EvidenceDocument = InferSchemaType<typeof evidenceSchema>;
export const Evidence: Model<EvidenceDocument> = model<EvidenceDocument>('Evidence', evidenceSchema);