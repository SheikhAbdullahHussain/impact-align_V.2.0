import type { AuditEntry, AuditRepository } from '../data/repositories';
import type { AppLogger } from '../common/logger';

/** Writes security events to the audit log and the structured log. Never throws into a request. */
export class AuditService {
  constructor(
    private readonly repo: AuditRepository,
    private readonly logger: AppLogger,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    this.logger.info(
      {
        securityEvent: entry.action,
        outcome: entry.outcome,
        actorId: entry.actorId,
        requestId: entry.requestId,
        ...entry.metadata,
      },
      'security event',
    );
    try {
      await this.repo.insert(entry);
    } catch (err) {
      this.logger.error({ err, securityEvent: entry.action }, 'Failed to write audit log');
    }
  }
}
