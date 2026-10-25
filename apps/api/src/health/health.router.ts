import { Router } from 'express';
import type { HealthCheckResult } from '@impactalign/types';
import type { HealthService } from './health.service';

const statusCodeFor = (result: HealthCheckResult): number => (result.status === 'ok' ? 200 : 503);

/** GET /health, /health/database, /health/redis — unauthenticated and rate-limit exempt. */
export function createHealthRouter(service: HealthService): Router {
  const router = Router();

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  router.get('/', (_req, res) => {
    res.json(service.liveness());
  });

  router.get('/database', async (_req, res) => {
    const result = await service.checkDatabase();
    res.status(statusCodeFor(result)).json(result);
  });

  router.get('/redis', async (_req, res) => {
    const result = await service.checkRedis();
    res.status(statusCodeFor(result)).json(result);
  });

  return router;
}
