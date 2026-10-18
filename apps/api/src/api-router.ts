import { Router } from 'express';
import type { ApiEnv } from '@impactalign/config';
import { createAuthRouter } from './auth/auth.router';
import { authenticate, csrfGuard, originGuard, requireJson } from './auth/middleware';
import { createRateLimiter } from './common/rate-limit';
import { createOrganizationsRouter } from './organizations/organizations.router';
import { createUsersRouter } from './users/users.router';
import type { Services } from './services';

/** Everything under /api/v1. Order matters: origin → JSON → session → CSRF → routes. */
export function createApiRouter(env: ApiEnv, services: Services): Router {
  const router = Router();
  const allowedOrigins = new Set(env.API_CORS_ORIGINS.map((origin) => new URL(origin).origin));
  const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, limit: env.AUTH_RATE_LIMIT_MAX });

  router.use(originGuard(allowedOrigins));
  router.use(requireJson);
  router.use(authenticate(services.auth, services.cookie));
  router.use(csrfGuard);

  router.use(
    '/auth',
    createAuthRouter({ auth: services.auth, cookie: services.cookie, limiter: authLimiter }),
  );
  router.use('/users', createUsersRouter(services.users));
  router.use('/organizations', createOrganizationsRouter(services.organizations));

  return router;
}
