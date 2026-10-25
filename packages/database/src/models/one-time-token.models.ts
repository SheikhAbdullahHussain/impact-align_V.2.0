import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** One-time token (stored hashed). Used for email verification and password reset. */
const oneTimeTokenFields = () => ({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  usedAt: { type: Date, default: null },
});

const emailVerificationSchema = new Schema(oneTimeTokenFields(), {
  timestamps: { createdAt: true, updatedAt: false },
});
const passwordResetTokenSchema = new Schema(oneTimeTokenFields(), {
  timestamps: { createdAt: true, updatedAt: false },
});

export type EmailVerificationDocument = InferSchemaType<typeof emailVerificationSchema>;
export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema>;

export const EmailVerification: Model<EmailVerificationDocument> = model<EmailVerificationDocument>(
  'EmailVerification',
  emailVerificationSchema,
);
export const PasswordResetToken: Model<PasswordResetTokenDocument> =
  model<PasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);
