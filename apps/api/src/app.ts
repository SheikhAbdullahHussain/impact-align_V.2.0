import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { ApiEnv } from '@impactalign/config';
import type { ApiErrorBody } from '@impactalign/types';
import { errorHandler, notFoundHandler } from './common/error-handler';
import type { AppLogger } from './common/logger';
import { createHealthRouter } from './health/health.router';
import type { HealthService } from './health/health.service';
import { openApiDocument } from './openapi/openapi';

export interface AppDependencies {
  readonly env: ApiEnv;
  readonly logger: AppLogger;
  readonly healthService: HealthService;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export function createApp({ env, logger, healthService }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.API_TRUST_PROXY);

  // Request ID + structured request logging. Client-supplied IDs are accepted only if well-formed.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id =
          typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)
            ? incoming
            : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
    }),
  );

  // API docs UI (never in production — enforced by env validation). Needs its own relaxed CSP.
  if (env.API_SWAGGER_ENABLED) {
    app.use('/docs', helmet({ contentSecurityPolicy: false }));
    app.get('/docs/openapi.json', (_req, res) => {
      res.json(openApiDocument);
    });
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { 'default-src': ["'none'"], 'frame-ancestors': ["'none'"] },
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  const allowedOrigins = new Set(env.API_CORS_ORIGINS.map((origin) => new URL(origin).origin));
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
      maxAge: 600,
    }),
  );

  // Health endpoints are mounted before rate limiting so orchestrator probes are never throttled.
  app.use('/health', createHealthRouter(healthService));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (req, res) => {
        const body: ApiErrorBody = {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            requestId: typeof req.id === 'string' ? req.id : 'unknown',
          },
        };
        res.status(429).json(body);
      },
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  // Feature routers are registered here in later phases (all under /api/v1).

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
