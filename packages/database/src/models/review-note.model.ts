import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { REVIEW_NOTE_KINDS } from '@impactalign/types';

const reviewNoteSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: [...REVIEW_NOTE_KINDS], required: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ReviewNoteDocument = InferSchemaType<typeof reviewNoteSchema>;
export const ReviewNote: Model<ReviewNoteDocument> = model<ReviewNoteDocument>(
  'ReviewNote',
  reviewNoteSchema,
);