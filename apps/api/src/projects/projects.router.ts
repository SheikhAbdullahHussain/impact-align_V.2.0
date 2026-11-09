import { Router } from 'express';
import { Permission } from '@impactalign/types';
import { projectInputSchema } from '@impactalign/validation';
import { requestContext, requireAuth, requirePermission } from '../auth/middleware';
import { validateBody } from '../common/validate';
import type { ProjectsService } from './projects.service';

export function createProjectsRouter(projects: ProjectsService): Router {
  const router = Router();
  router.use(requireAuth);

  router.post(
    '/',
    requirePermission(Permission.PROJECT_CREATE),
    validateBody(projectInputSchema),
    async (req, res) => {
      res.status(201).json({ project: await projects.create(req.auth!.user, req.body) });
    },
  );

  router.get('/', requirePermission(Permission.PROJECT_READ), async (req, res) => {
    res.json({ projects: await projects.listMine(req.auth!.user) });
  });

  router.get('/:id', requirePermission(Permission.PROJECT_READ), async (req, res) => {
    res.json({ project: await projects.get(req.auth!.user, String(req.params['id'])) });
  });

  router.put(
    '/:id',
    requirePermission(Permission.PROJECT_UPDATE),
    validateBody(projectInputSchema),
    async (req, res) => {
      res.json({
        project: await projects.update(req.auth!.user, String(req.params['id']), req.body),
      });
    },
  );

  router.delete('/:id', requirePermission(Permission.PROJECT_UPDATE), async (req, res) => {
    await projects.remove(req.auth!.user, String(req.params['id']));
    res.status(204).end();
  });

  router.post('/:id/submit', requirePermission(Permission.EVIDENCE_SUBMIT), async (req, res) => {
    res.json({
      project: await projects.submit(
        req.auth!.user,
        String(req.params['id']),
        requestContext(req),
      ),
    });
  });

  router.post('/:id/withdraw', requirePermission(Permission.EVIDENCE_SUBMIT), async (req, res) => {
    res.json({
      project: await projects.withdraw(
        req.auth!.user,
        String(req.params['id']),
        requestContext(req),
      ),
    });
  });

  return router;
}