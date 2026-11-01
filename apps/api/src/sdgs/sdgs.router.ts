import { Router, type Request, type RequestHandler, type Response } from 'express';
import type { SdgDto, SdgIndicatorDto, SdgTargetDto } from '@impactalign/types';
import { sdgNumberParamSchema } from '@impactalign/validation';
import type { SdgIndicatorRecord, SdgRecord, SdgTargetRecord } from '../data/repositories';
import type { SdgsService } from './sdgs.service';

const toSdg = (r: SdgRecord): SdgDto => ({
  id: r.id,
  number: r.number,
  code: r.code,
  title: r.title,
  description: r.description,
  officialUrl: r.officialUrl,
});

const toTarget = (r: SdgTargetRecord): SdgTargetDto => ({
  id: r.id,
  sdgId: r.sdgId,
  code: r.code,
  title: r.title,
  description: r.description,
  officialUrl: r.officialUrl,
});

const toIndicator = (r: SdgIndicatorRecord): SdgIndicatorDto => ({
  id: r.id,
  sdgId: r.sdgId,
  targetId: r.targetId,
  code: r.code,
  title: r.title,
  description: r.description,
  officialUrl: r.officialUrl,
});

const route =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

/** Validates :id and loads the SDG; sends 400/404 itself and returns null when it cannot proceed. */
async function resolveSdg(
  service: SdgsService,
  req: Request,
  res: Response,
): Promise<SdgRecord | null> {
  const params = sdgNumberParamSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: params.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return null;
  }
  const sdg = await service.findSDGByNumber(params.data.id);
  if (!sdg) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'SDG not found' } });
    return null;
  }
  return sdg;
}

/** Read-only SDG catalogue. Mounted at /api/v1/sdgs. */
export function createSdgsRouter(service: SdgsService): Router {
  const router = Router();

  router.get(
    '/',
    route(async (_req, res) => {
      const rows = await service.listSDGs();
      res.json({ data: rows.map(toSdg) });
    }),
  );

  router.get(
    '/:id',
    route(async (req, res) => {
      const sdg = await resolveSdg(service, req, res);
      if (sdg) res.json({ data: toSdg(sdg) });
    }),
  );

  router.get(
    '/:id/targets',
    route(async (req, res) => {
      const sdg = await resolveSdg(service, req, res);
      if (!sdg) return;
      const rows = await service.listTargetsBySdgId(sdg.id);
      res.json({ data: rows.map(toTarget) });
    }),
  );

  router.get(
    '/:id/indicators',
    route(async (req, res) => {
      const sdg = await resolveSdg(service, req, res);
      if (!sdg) return;
      const rows = await service.listIndicatorsBySdgId(sdg.id);
      res.json({ data: rows.map(toIndicator) });
    }),
  );

  return router;
}