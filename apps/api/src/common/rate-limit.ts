import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import type { ApiErrorBody } from '@impactalign/types';

/** Per-IP limiter returning the standard error envelope. In-memory: per instance (see docs). */
export function createRateLimiter(options: { windowMs: number; limit: number }): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
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
  });
}
