import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PLATFORM_ROLES } from '@impactalign/types';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    /** Never returned by default; select it explicitly with .select('+passwordHash'). */
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: String, enum: [...PLATFORM_ROLES] }],
      default: ['PUBLIC_USER'],
    },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    emailVerifiedAt: { type: Date, default: null },
    /** Reserved for multi-factor authentication (not implemented yet). */
    mfa: {
      enabled: { type: Boolean, default: false },
      secretEncrypted: { type: String, select: false, default: null },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User: Model<UserDocument> = model<UserDocument>('User', userSchema);
