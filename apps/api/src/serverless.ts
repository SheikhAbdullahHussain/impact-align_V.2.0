import type { Express } from 'express';
import { connectMongo, pingMongo } from '@impactalign/database';
import type { createApp as CreateApp } from './app';
import { ConsoleEmailSender, NoopEmailSender } from './auth/email';
import { createLogger } from './common/logger';
import { loadEnv } from './config/env';
import { createMongoRepositories } from './data/mongo-repositories';
import { HealthService } from './health/health.service';
import { createRedisClient, pingRedis } from './infrastructure/redis';
import { createServices } from './services';

let cached: Promise<Express> | undefined;

async function build(create: typeof CreateApp): Promise<Express> {
  const env = loadEnv();
  const logger = createLogger(env);

  await connectMongo({ uri: env.MONGODB_URI });
  const redis = createRedisClient(env.REDIS_URL, logger);

  const healthService = new HealthService(
    { pingDatabase: pingMongo, pingRedis: () => pingRedis(redis) },
    {
      serviceName: 'impactalign-api',
      version: process.env['npm_package_version'] ?? '0.1.0',
      timeoutMs: env.HEALTH_CHECK_TIMEOUT_MS,
      logger,
    },
  );

  const services = createServices({
    env,
    logger,
    repos: createMongoRepositories(),
    email:
      env.EMAIL_TRANSPORT === 'console' ? new ConsoleEmailSender(logger) : new NoopEmailSender(),
  });

  return create({ env, logger, healthService, services });
}

/** One app per serverless instance, built on the first request. A failed start is retried. */
export function getApp(create: typeof CreateApp): Promise<Express> {
  cached ??= build(create).catch((error: unknown) => {
    cached = undefined;
    throw error;
  });
  return cached;
}
