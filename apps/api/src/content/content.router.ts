import { Router } from 'express';
import { Permission } from '@impactalign/types';
import { requestContext, requireAuth, requirePermission } from '../auth/middleware';
import type { ContentService } from './content.service';

/** Mounted at /api/v1/content: public, published content only. */
export function createContentRouter(content: ContentService): Router {
  const router = Router();
  router.get('/:kind/:key', async (req, res) => {
    const entry = await content.getPublished(String(req.params['kind']), String(req.params['key']));
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ entry });
  });
  return router;
}

/** Mounted at /api/v1/admin/content: staff with ADMIN_ACCESS only. */
export function createAdminContentRouter(content: ContentService): Router {
  const router = Router();
  router.use(requireAuth, requirePermission(Permission.ADMIN_ACCESS));

  router.get('/', async (_req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ items: await content.list() });
  });

  router.get('/:kind/:key', async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      entry: await content.getEntry(String(req.params['kind']), String(req.params['key'])),
    });
  });

  router.put('/:kind/:key', async (req, res) => {
    res.json({
      entry: await content.save(
        req.auth!.user,
        String(req.params['kind']),
        String(req.params['key']),
        req.body,
        requestContext(req),
      ),
    });
  });

  return router;
}
