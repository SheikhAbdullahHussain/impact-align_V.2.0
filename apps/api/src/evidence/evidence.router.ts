import express, { Router } from 'express';
import { Permission } from '@impactalign/types';
import { requestContext, requireAuth, requirePermission } from '../auth/middleware';
import { HttpError } from '../common/http-error';
import type { EvidenceService } from './evidence.service';
import { MAX_EVIDENCE_BYTES } from './file-validation';

/** Mounted at /api/v1/projects. The file is the raw request body; its name is in X-File-Name. */
export function createEvidenceRouter(evidence: EvidenceService): Router {
  const router = Router();
  router.use(requireAuth);

  router.post(
    '/:projectId/evidence',
    requirePermission(Permission.EVIDENCE_UPLOAD),
    express.raw({ type: () => true, limit: MAX_EVIDENCE_BYTES }),
    async (req, res) => {
      const body: unknown = req.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        throw new HttpError(400, 'INVALID_FILE', 'Send the file as the request body.');
      }
      let name: string;
      try {
        name = decodeURIComponent(req.get('x-file-name') ?? '');
      } catch {
        throw new HttpError(400, 'INVALID_FILE', 'The file name is not valid.');
      }
      const created = await evidence.upload(
        req.auth!.user,
        String(req.params['projectId']),
        name,
        body,
        requestContext(req),
      );
      res.status(201).json({ evidence: created });
    },
  );

  router.get('/:projectId/evidence', requirePermission(Permission.PROJECT_READ), async (req, res) => {
    res.json({ evidence: await evidence.list(req.auth!.user, String(req.params['projectId'])) });
  });

  router.get(
    '/:projectId/evidence/:evidenceId/file',
    requirePermission(Permission.PROJECT_READ),
    async (req, res) => {
      const { record, data } = await evidence.download(
        req.auth!.user,
        String(req.params['projectId']),
        String(req.params['evidenceId']),
      );
      // The stored name is sanitised to [\w.\- ()], so it is safe inside the header.
      res.setHeader('Content-Type', record.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${record.originalName}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(data);
    },
  );

  router.delete(
    '/:projectId/evidence/:evidenceId',
    requirePermission(Permission.EVIDENCE_UPLOAD),
    async (req, res) => {
      await evidence.remove(
        req.auth!.user,
        String(req.params['projectId']),
        String(req.params['evidenceId']),
        requestContext(req),
      );
      res.status(204).end();
    },
  );

  return router;
}