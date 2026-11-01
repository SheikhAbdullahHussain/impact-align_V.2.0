import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const frameworkSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 220,
    },
    description: { type: String, default: null, trim: true },
    publisher: { type: String, default: null, trim: true },
    officialUrl: { type: String, default: null, trim: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// frameworkSchema.index({ slug: 1 }, { unique: true });
frameworkSchema.index({ deletedAt: 1 });

const frameworkVersionSchema = new Schema(
  {
    frameworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Framework',
      required: true,
      index: true,
    },
    version: { type: String, required: true, trim: true, maxlength: 50 },
    title: { type: String, default: null, trim: true, maxlength: 200 },
    description: { type: String, default: null, trim: true },
    effectiveFrom: { type: Date, default: null },
    effectiveUntil: { type: Date, default: null },
    officialUrl: { type: String, default: null, trim: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

frameworkVersionSchema.index(
  { frameworkId: 1, version: 1 },
  { unique: true },
);
frameworkVersionSchema.index({ deletedAt: 1 });

const criterionSchema = new Schema(
  {
    frameworkVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'FrameworkVersion',
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, default: null, trim: true, maxlength: 300 },
    description: { type: String, default: null, trim: true },
    parentCriterionId: {
      type: Schema.Types.ObjectId,
      ref: 'Criterion',
      default: null,
      index: true,
    },
    sdgId: { type: Schema.Types.ObjectId, ref: 'SDG', default: null, index: true },
    targetId: {
      type: Schema.Types.ObjectId,
      ref: 'SDGTarget',
      default: null,
      index: true,
    },
    indicatorId: {
      type: Schema.Types.ObjectId,
      ref: 'SDGIndicator',
      default: null,
      index: true,
    },
    sortOrder: { type: Number, default: 0, min: 0 },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

criterionSchema.index(
  { frameworkVersionId: 1, code: 1 },
  { unique: true },
);
criterionSchema.index({ deletedAt: 1 });

const evidenceRequirementSchema = new Schema(
  {
    criterionId: {
      type: Schema.Types.ObjectId,
      ref: 'Criterion',
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, default: null, trim: true, maxlength: 300 },
    description: { type: String, default: null, trim: true },
    acceptedMimeTypes: {
      type: [String],
      default: [],
    },
    isMandatory: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

evidenceRequirementSchema.index(
  { criterionId: 1, code: 1 },
  { unique: true },
);
evidenceRequirementSchema.index({ deletedAt: 1 });

export type FrameworkDocument = InferSchemaType<typeof frameworkSchema>;
export type FrameworkVersionDocument = InferSchemaType<
  typeof frameworkVersionSchema
>;
export type CriterionDocument = InferSchemaType<typeof criterionSchema>;
export type EvidenceRequirementDocument = InferSchemaType<
  typeof evidenceRequirementSchema
>;

export const Framework: Model<FrameworkDocument> =
  model<FrameworkDocument>('Framework', frameworkSchema);

export const FrameworkVersion: Model<FrameworkVersionDocument> =
  model<FrameworkVersionDocument>('FrameworkVersion', frameworkVersionSchema);

export const Criterion: Model<CriterionDocument> =
  model<CriterionDocument>('Criterion', criterionSchema);

export const EvidenceRequirement: Model<EvidenceRequirementDocument> =
  model<EvidenceRequirementDocument>(
    'EvidenceRequirement',
    evidenceRequirementSchema,
  );