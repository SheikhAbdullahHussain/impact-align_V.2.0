import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Login attempts per email (including unknown emails) for lockout. Auto-deleted after 30 days. */
const loginAttemptSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, index: true },
  success: { type: Boolean, required: true },
  ipAddress: { type: String, trim: true, maxlength: 64 },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});
loginAttemptSchema.index({ email: 1, success: 1, createdAt: -1 });

export type LoginAttemptDocument = InferSchemaType<typeof loginAttemptSchema>;
export const LoginAttempt: Model<LoginAttemptDocument> = model<LoginAttemptDocument>(
  'LoginAttempt',
  loginAttemptSchema,
);
