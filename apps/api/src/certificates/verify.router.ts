import { Router } from 'express';
import { createRateLimiter } from '../common/rate-limit';
import type { CertificatesService } from './certificates.service';

/** Mounted at /api/v1/verify. Public (no login), rate limited per IP. */
export function createVerifyRouter(certificates: CertificatesService): Router {
  const router = Router();
  router.use(createRateLimiter({ windowMs: 60_000, limit: 30 }));

  router.get('/:code', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ verification: await certificates.publicVerify(String(req.params['code'])) });
  });

  return router;
}
