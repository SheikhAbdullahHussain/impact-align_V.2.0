import type { Express } from 'express';
import { parseApiEnv, type ApiEnv } from '@impactalign/config';
import { createApp } from './app';
import { cookieSettings } from './auth/cookies';
import { createLogger } from './common/logger';
import { HealthService, type HealthProbes } from './health/health.service';
import { buildAuthTestContext } from './testing/auth-context';
import { SdgsService } from './sdgs/sdgs.service';
import { ProjectsService } from './projects/projects.service';
import { EvidenceService } from './evidence/evidence.service';
import { MemoryFileStorage } from './testing/memory-storage';
import { AssessmentsService } from './assessments/assessments.service';

export const testEnv = (overrides: Record<string, string> = {}): ApiEnv =>
  parseApiEnv({
    NODE_ENV: 'test',
    API_CORS_ORIGINS: 'http://localhost:3000',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    AUTH_RATE_LIMIT_MAX: '1000',
    ...overrides,
  });

/** App wired to in-memory data, plus handles to the pieces tests need to drive and inspect. */
export function buildTestContext(
  probes: Partial<HealthProbes> = {},
  envOverrides: Record<string, string> = {},
) {
  const env = testEnv(envOverrides);
  const logger = createLogger(env);
  const t = buildAuthTestContext();
  const healthService = new HealthService(
    {
      pingDatabase: probes.pingDatabase ?? (() => Promise.resolve()),
      pingRedis: probes.pingRedis ?? (() => Promise.resolve()),
    },
    { serviceName: 'impactalign-api', version: 'test', timeoutMs: 200, logger },
  );

  const storage = new MemoryFileStorage();

  const services = {
    auth: t.auth,
    audit: t.audit,
    cookie: cookieSettings(env),
    users: t.users,
    organizations: t.organizations,
    sdgs: new SdgsService(t.repos.sdgs),
    projects: new ProjectsService({ repos: t.repos, audit: t.audit }),
    evidence: new EvidenceService({ repos: t.repos, audit: t.audit, storage }),
    assessments: new AssessmentsService({ repos: t.repos, audit: t.audit, storage }),
  };

  const app = createApp({ env, logger, healthService, services });
  return { app, env, ...t };
}
export function buildTestApp(
  probes: Partial<HealthProbes> = {},
  envOverrides: Record<string, string> = {},
): Express {
  return buildTestContext(probes, envOverrides).app;
}
