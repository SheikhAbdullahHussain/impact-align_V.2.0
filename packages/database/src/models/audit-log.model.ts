import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Append-only audit trail for security- and compliance-relevant actions.
 * Foundation only: later phases add the concrete event catalogue (LOGIN_SUCCESS, ...).
 * Application code must only ever INSERT; update and delete operations are blocked below.
 */
const auditLogSchema = new Schema(
  {
    action: { type: String, required: true, trim: true, maxlength: 100, index: true },
    actorId: { type: Schema.Types.ObjectId, default: null, index: true },
    /** Tenant scope. Null only for platform-level events. */
    organizationId: { type: Schema.Types.ObjectId, default: null, index: true },
    resourceType: { type: String, trim: true, maxlength: 100 },
    resourceId: { type: String, trim: true, maxlength: 100 },
    outcome: { type: String, enum: ['success', 'failure'], required: true },
    requestId: { type: String, trim: true, maxlength: 100 },
    ipAddress: { type: String, trim: true, maxlength: 64 },
    /** Never store secrets, tokens, passwords or document contents here. */
    metadata: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ organizationId: 1, createdAt: -1 });

const immutable = (): never => {
  throw new Error('Audit log entries are immutable');
};
for (const hook of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
] as const) {
  auditLogSchema.pre(hook, immutable);
}

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLog: Model<AuditLogDocument> = model<AuditLogDocument>(
  'AuditLog',
  auditLogSchema,
);
