import type { Express } from 'express';
import { parseApiEnv, type ApiEnv } from '@impactalign/config';
import { createApp } from './app';
import { createLogger } from './common/logger';
import { HealthService, type HealthProbes } from './health/health.service';

export const testEnv = (overrides: Record<string, string> = {}): ApiEnv =>
  parseApiEnv({
    NODE_ENV: 'test',
    API_CORS_ORIGINS: 'http://localhost:3000',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    ...overrides,
  });

export function buildTestApp(
  probes: Partial<HealthProbes> = {},
  envOverrides: Record<string, string> = {},
): Express {
  const env = testEnv(envOverrides);
  const logger = createLogger(env);
  const healthService = new HealthService(
    {
      pingDatabase: probes.pingDatabase ?? (() => Promise.resolve()),
      pingRedis: probes.pingRedis ?? (() => Promise.resolve()),
    },
    { serviceName: 'impactalign-api', version: 'test', timeoutMs: 200, logger },
  );
  return createApp({ env, logger, healthService });
}
