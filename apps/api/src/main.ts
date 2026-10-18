import { disconnectMongo, pingMongo } from '@impactalign/database';
import { createApp } from './app';
import { ConsoleEmailSender, NoopEmailSender } from './auth/email';
import { createLogger } from './common/logger';
import { loadEnv } from './config/env';
import { createMongoRepositories } from './data/mongo-repositories';
import { HealthService } from './health/health.service';
import { connectMongoWithRetry } from './infrastructure/mongo';
import { createRedisClient, pingRedis } from './infrastructure/redis';
import { createServices } from './services';

const SERVICE_VERSION = process.env['npm_package_version'] ?? '0.1.0';

function main(): void {
  const env = loadEnv();
  const logger = createLogger(env);

  const stopMongoRetry = connectMongoWithRetry(env.MONGODB_URI, logger);
  const redis = createRedisClient(env.REDIS_URL, logger);

  const healthService = new HealthService(
    { pingDatabase: pingMongo, pingRedis: () => pingRedis(redis) },
    {
      serviceName: 'impactalign-api',
      version: SERVICE_VERSION,
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

  const app = createApp({ env, logger, healthService, services });
  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info({ port: env.API_PORT, env: env.NODE_ENV }, 'API listening');
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    stopMongoRetry();
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(() => {
      void Promise.allSettled([disconnectMongo(), redis.quit()]).then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

try {
  main();
} catch (err) {
  // Env validation errors list variable names only — never values.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
