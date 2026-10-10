export type HealthStatus = 'ok' | 'down';

export interface HealthCheckResult {
  status: HealthStatus;
  /** Which component was checked. */
  check: 'liveness' | 'database' | 'redis';
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Round-trip time of the dependency probe, when applicable. */
  latencyMs?: number;
}

export interface LivenessResult extends HealthCheckResult {
  check: 'liveness';
  service: string;
  version: string;
  uptimeSeconds: number;
}
