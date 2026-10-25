import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Server-side session. Only the SHA-256 of the cookie token is stored. */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    csrfToken: { type: String, required: true },
    lastSeenAt: { type: Date, required: true },
    idleExpiresAt: { type: Date, required: true },
    /** Hard limit; the TTL index removes the document after this moment. */
    absoluteExpiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
    ipAddress: { type: String, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type SessionDocument = InferSchemaType<typeof sessionSchema>;
export const Session: Model<SessionDocument> = model<SessionDocument>('Session', sessionSchema);
