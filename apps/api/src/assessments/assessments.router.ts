import { Router } from 'express';
import { Permission } from '@impactalign/types';
import { clarificationSchema, decisionSchema } from '@impactalign/validation';
import { requestContext, requireAuth, requirePermission } from '../auth/middleware';
import { validateBody } from '../common/validate';
import type { AssessmentsService } from './assessments.service';

/** Mounted at /api/v1/assessments: reviewers only. */
export function createAssessmentsRouter(assessments: AssessmentsService): Router {
  const router = Router();
  router.use(requireAuth, requirePermission(Permission.ASSESSMENT_REVIEW));

  router.get('/queue', async (req, res) => {
    res.json({ queue: await assessments.queue(req.auth!.user) });
  });

  router.get('/:projectId', async (req, res) => {
    res.json({
      assessment: await assessments.detail(req.auth!.user, String(req.params['projectId'])),
    });
  });

  router.post('/:projectId/start', async (req, res) => {
    res.json({
      project: await assessments.start(
        req.auth!.user,
        String(req.params['projectId']),
        requestContext(req),
      ),
    });
  });

  router.post('/:projectId/clarification', validateBody(clarificationSchema), async (req, res) => {
    res.json({
      project: await assessments.requestClarification(
        req.auth!.user,
        String(req.params['projectId']),
        req.body.message,
        requestContext(req),
      ),
    });
  });

  router.post(
    '/:projectId/decision',
    requirePermission(Permission.ACCREDITATION_REVIEW),
    validateBody(decisionSchema),
    async (req, res) => {
      res.json({
        project: await assessments.decide(
          req.auth!.user,
          String(req.params['projectId']),
          req.body.decision,
          req.body.rationale,
          requestContext(req),
        ),
      });
    },
  );

  router.get('/:projectId/evidence/:evidenceId/file', async (req, res) => {
    const { record, data } = await assessments.downloadEvidence(
      req.auth!.user,
      String(req.params['projectId']),
      String(req.params['evidenceId']),
    );
    // The stored name is sanitised to [\w.\- ()], so it is safe inside the header.
    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${record.originalName}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(data);
  });

  return router;
}

/** Mounted at /api/v1/projects: the owner reads reviewer feedback on their own project. */
export function createFeedbackRouter(assessments: AssessmentsService): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/:projectId/feedback', requirePermission(Permission.PROJECT_READ), async (req, res) => {
    res.json({
      notes: await assessments.feedback(req.auth!.user, String(req.params['projectId'])),
    });
  });

  return router;
}