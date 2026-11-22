import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Website content edited from the admin panel. One document per (kind, key). */
const contentSchema = new Schema(
  {
    kind: { type: String, enum: ['FAQ', 'SECTION', 'LEGAL', 'PLANS'], required: true },
    key: { type: String, required: true, maxlength: 80 },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    data: { type: Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, default: null },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, minimize: false },
);

contentSchema.index({ kind: 1, key: 1 }, { unique: true });

export type ContentEntryDocument = InferSchemaType<typeof contentSchema>;
export const ContentEntry: Model<ContentEntryDocument> = model<ContentEntryDocument>(
  'ContentEntry',
  contentSchema,
);
