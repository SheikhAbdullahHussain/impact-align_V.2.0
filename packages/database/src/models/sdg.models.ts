import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const sdgSchema = new Schema(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 17,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: { type: String, default: null, trim: true, maxlength: 300 },
    description: { type: String, default: null, trim: true },
    officialUrl: { type: String, default: null, trim: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// sdgSchema.index({ number: 1 }, { unique: true });
sdgSchema.index({ deletedAt: 1 });

const sdgTargetSchema = new Schema(
  {
    sdgId: {
      type: Schema.Types.ObjectId,
      ref: 'SDG',
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, maxlength: 30 },
    title: { type: String, default: null, trim: true, maxlength: 500 },
    description: { type: String, default: null, trim: true },
    officialUrl: { type: String, default: null, trim: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sdgTargetSchema.index({ sdgId: 1, code: 1 }, { unique: true });
sdgTargetSchema.index({ deletedAt: 1 });

const sdgIndicatorSchema = new Schema(
  {
    sdgId: {
      type: Schema.Types.ObjectId,
      ref: 'SDG',
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      ref: 'SDGTarget',
      default: null,
      index: true,
    },
    code: { type: String, required: true, trim: true, maxlength: 50 },
    title: { type: String, default: null, trim: true, maxlength: 500 },
    description: { type: String, default: null, trim: true },
    officialUrl: { type: String, default: null, trim: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sdgIndicatorSchema.index({ sdgId: 1, code: 1 }, { unique: true });
// sdgIndicatorSchema.index({ targetId: 1 });
sdgIndicatorSchema.index({ deletedAt: 1 });

export type SDGDocument = InferSchemaType<typeof sdgSchema>;
export type SDGTargetDocument = InferSchemaType<typeof sdgTargetSchema>;
export type SDGIndicatorDocument = InferSchemaType<typeof sdgIndicatorSchema>;

export const SDG: Model<SDGDocument> =
  model<SDGDocument>('SDG', sdgSchema);

export const SDGTarget: Model<SDGTargetDocument> =
  model<SDGTargetDocument>('SDGTarget', sdgTargetSchema);

export const SDGIndicator: Model<SDGIndicatorDocument> =
  model<SDGIndicatorDocument>('SDGIndicator', sdgIndicatorSchema);