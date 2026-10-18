import { Router } from 'express';
import { createOrganizationSchema } from '@impactalign/validation';
import { Permission } from '@impactalign/types';
import { requestContext, requirePermission, requireAuth } from '../auth/middleware';
import { validateBody } from '../common/validate';
import type { OrganizationsService } from './organizations.service';

export function createOrganizationsRouter(organizations: OrganizationsService): Router {
  const router = Router();
  router.use(requireAuth);

  router.post(
    '/',
    requirePermission(Permission.ORG_CREATE),
    validateBody(createOrganizationSchema),
    async (req, res) => {
      res.status(201).json({
        organization: await organizations.create(
          req.auth!.user,
          req.body.name,
          requestContext(req),
        ),
      });
    },
  );

  router.get('/', async (req, res) => {
    res.json({ organizations: await organizations.listMine(req.auth!.user) });
  });

  router.get('/:orgId', async (req, res) => {
    res.json({
      organization: await organizations.get(req.auth!.user, String(req.params['orgId'])),
    });
  });

  router.get('/:orgId/members', async (req, res) => {
    res.json({
      members: await organizations.listMembers(req.auth!.user, String(req.params['orgId'])),
    });
  });

  router.patch('/:orgId', validateBody(createOrganizationSchema), async (req, res) => {
    res.json({
      organization: await organizations.rename(
        req.auth!.user,
        String(req.params['orgId']),
        req.body.name,
      ),
    });
  });

  return router;
}
