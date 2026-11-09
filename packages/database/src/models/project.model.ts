import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PROJECT_STATUSES } from '@impactalign/types';

const projectSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, default: '', trim: true, maxlength: 2000 },
    sdgNumbers: { type: [Number], default: [] },
    status: { type: String, enum: [...PROJECT_STATUSES], default: 'DRAFT' },
    submittedAt: { type: Date, default: null },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project: Model<ProjectDocument> = model<ProjectDocument>('Project', projectSchema);