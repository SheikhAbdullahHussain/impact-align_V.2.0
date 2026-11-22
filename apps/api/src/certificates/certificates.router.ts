import { Router } from 'express';
import { Permission } from '@impactalign/types';
import { requestContext, requireAuth, requirePermission } from '../auth/middleware';
import type { CertificatesService } from './certificates.service';

/** Mounted at /api/v1/certificates. Owners read their own; ASSESSOR revokes. */
export function createCertificatesRouter(certificates: CertificatesService): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', requirePermission(Permission.PROJECT_READ), async (req, res) => {
    res.json({ certificates: await certificates.listMine(req.auth!.user.id) });
  });

  router.get(
    '/lookup/:code',
    requirePermission(Permission.ACCREDITATION_REVIEW),
    async (req, res) => {
      res.json({ certificate: await certificates.lookupByCode(String(req.params['code'])) });
    },
  );

  router.get('/:projectId', requirePermission(Permission.PROJECT_READ), async (req, res) => {
    res.json({
      certificate: await certificates.getMine(req.auth!.user.id, String(req.params['projectId'])),
    });
  });

  router.get(
    '/:projectId/download',
    requirePermission(Permission.PROJECT_READ),
    async (req, res) => {
      const { data, fileName } = await certificates.getPdf(
        req.auth!.user.id,
        String(req.params['projectId']),
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(data);
    },
  );

  router.post(
    '/:projectId/revoke',
    requirePermission(Permission.ACCREDITATION_REVIEW),
    async (req, res) => {
      res.json({
        certificate: await certificates.revoke(
          req.auth!.user,
          String(req.params['projectId']),
          String((req.body as { reason?: unknown } | undefined)?.reason ?? ''),
          requestContext(req),
        ),
      });
    },
  );

  return router;
}
