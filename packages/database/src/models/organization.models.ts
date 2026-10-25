import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { ORGANIZATION_ROLES } from '@impactalign/types';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 140,
    },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/** Membership is the ONLY thing that grants a user access to an organization's data. */
const organizationMemberSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: [...ORGANIZATION_ROLES], required: true },
  },
  { timestamps: true },
);
organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export type OrganizationDocument = InferSchemaType<typeof organizationSchema>;
export type OrganizationMemberDocument = InferSchemaType<typeof organizationMemberSchema>;

export const Organization: Model<OrganizationDocument> = model<OrganizationDocument>(
  'Organization',
  organizationSchema,
);
export const OrganizationMember: Model<OrganizationMemberDocument> =
  model<OrganizationMemberDocument>('OrganizationMember', organizationMemberSchema);
