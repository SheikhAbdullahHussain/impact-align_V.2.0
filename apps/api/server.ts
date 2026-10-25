import express from 'express';
import { connectMongo, pingMongo } from '@impactalign/database';
import { createLogger } from './src/common/logger';
import { loadEnv } from './src/config/env';
import { createMongoRepositories } from './src/data/mongo-repositories';
import { HealthService } from './src/health/health.service';
import { createRedisClient, pingRedis } from './src/infrastructure/redis';
import { createApp } from './src/app';
import { NoopEmailSender } from './src/auth/email';
import { createServices } from './src/services';

const env = loadEnv();
const logger = createLogger(env);
const redis = createRedisClient(env.REDIS_URL, logger);

const healthService = new HealthService(
  {
    pingDatabase: pingMongo,
    pingRedis: () => pingRedis(redis),
  },
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
  email: new NoopEmailSender(),
});

const api = createApp({ env, logger, healthService, services });
const handler = express();

let mongoConnection: Promise<unknown> | undefined;

handler.use(async (_req, _res, next) => {
  try {
    if (!mongoConnection) {
      mongoConnection = connectMongo({ uri: env.MONGODB_URI }).catch((error: unknown) => {
        mongoConnection = undefined;
        throw error;
      });
    }

    await mongoConnection;
    next();
  } catch (error) {
    next(error);
  }
});

handler.use(api);

export default handler;