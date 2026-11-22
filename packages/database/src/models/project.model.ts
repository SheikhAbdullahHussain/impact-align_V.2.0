import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PROJECT_STATUSES, SUBMISSION_TYPES } from '@impactalign/types';

const projectSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, default: '', trim: true, maxlength: 2000 },
    sdgNumbers: { type: [Number], default: [] },
    submissionType: { type: String, enum: [...SUBMISSION_TYPES], default: 'PROJECT_PROPOSAL' },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    /** IASDG-XXXXXX. Issued at first submission; unique once set. */
    code: { type: String, default: null },
    targetIds: { type: [Schema.Types.ObjectId], ref: 'SDGTarget', default: [] },
    indicatorIds: { type: [Schema.Types.ObjectId], ref: 'SDGIndicator', default: [] },
    status: { type: String, enum: [...PROJECT_STATUSES], default: 'DRAFT' },
    submittedAt: { type: Date, default: null },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

projectSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } },
);

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project: Model<ProjectDocument> = model<ProjectDocument>('Project', projectSchema);
