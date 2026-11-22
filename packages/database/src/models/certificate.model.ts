import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const certificateSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    certificateNumber: { type: String, required: true, unique: true },
    code: { type: String, required: true, index: true },
    title: { type: String, required: true },
    submissionType: { type: String, required: true },
    sdgNumbers: { type: [Number], default: [] },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    /** Internal only. Never shown to the owner or on the public page. */
    revokedReason: { type: String, default: null },
    revokedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type CertificateDocument = InferSchemaType<typeof certificateSchema>;
export const Certificate: Model<CertificateDocument> = model<CertificateDocument>(
  'Certificate',
  certificateSchema,
);
