import { Router } from 'express';
import { Permission } from '@impactalign/types';
import { requireAuth, requirePermission } from '../auth/middleware';
import type { ReportsService } from './reports.service';

/** Mounted at /api/v1/reports: the owner reads their own assessment reports. */
export function createReportsRouter(reports: ReportsService): Router {
  const router = Router();
  router.use(requireAuth, requirePermission(Permission.PROJECT_READ));

  router.get('/', async (req, res) => {
    res.json({ reports: await reports.listMine(req.auth!.user.id) });
  });

  router.get('/:projectId', async (req, res) => {
    res.json({
      report: await reports.getMine(req.auth!.user.id, String(req.params['projectId'])),
    });
  });

  router.get('/:projectId/download', async (req, res) => {
    const report = await reports.getMine(req.auth!.user.id, String(req.params['projectId']));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report.code}-report.json"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(JSON.stringify(report, null, 2));
  });

  return router;
}
