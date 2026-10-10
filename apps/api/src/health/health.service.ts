import type { HealthCheckResult, LivenessResult } from '@impactalign/types';
import type { AppLogger } from '../common/logger';
import { withTimeout } from '../common/with-timeout';

export interface HealthProbes {
  pingDatabase(): Promise<void>;
  pingRedis(): Promise<void>;
}

export interface HealthServiceOptions {
  readonly serviceName: string;
  readonly version: string;
  readonly timeoutMs: number;
  readonly logger: AppLogger;
}

export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly probes: HealthProbes,
    private readonly options: HealthServiceOptions,
  ) {}

  /** Liveness: the process is up and able to serve requests. Touches no dependencies. */
  liveness(): LivenessResult {
    return {
      status: 'ok',
      check: 'liveness',
      timestamp: new Date().toISOString(),
      service: this.options.serviceName,
      version: this.options.version,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  checkDatabase(): Promise<HealthCheckResult> {
    return this.probe('database', () => this.probes.pingDatabase());
  }

  checkRedis(): Promise<HealthCheckResult> {
    return this.probe('redis', () => this.probes.pingRedis());
  }

  private async probe(
    check: 'database' | 'redis',
    run: () => Promise<void>,
  ): Promise<HealthCheckResult> {
    const started = performance.now();
    try {
      await withTimeout(run(), this.options.timeoutMs, `${check} health probe`);
      return {
        status: 'ok',
        check,
        timestamp: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - started),
      };
    } catch (err) {
      // Details go to the server log only; the response never exposes hostnames or errors.
      this.options.logger.warn({ err, check }, 'Health probe failed');
      return { status: 'down', check, timestamp: new Date().toISOString() };
    }
  }
}
