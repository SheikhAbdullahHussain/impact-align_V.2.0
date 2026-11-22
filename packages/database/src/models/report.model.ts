import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const sdgItem = {
  _id: false,
  code: { type: String, required: true },
  title: { type: String, default: null },
};

/** Immutable snapshot taken at the final decision. One per project. */
const reportSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    submissionType: { type: String, required: true },
    sdgNumbers: { type: [Number], default: [] },
    targets: { type: [sdgItem], default: [] },
    indicators: { type: [sdgItem], default: [] },
    evidence: {
      type: [
        {
          _id: false,
          fileName: { type: String, required: true },
          sha256: { type: String, required: true },
          sizeBytes: { type: Number, required: true },
          indicatorCode: { type: String, default: null },
        },
      ],
      default: [],
    },
    decision: { type: String, enum: ['VERIFIED', 'REJECTED'], required: true },
    rationale: { type: String, required: true },
    decidedAt: { type: Date, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ReportDocument = InferSchemaType<typeof reportSchema>;
export const Report: Model<ReportDocument> = model<ReportDocument>('Report', reportSchema);
