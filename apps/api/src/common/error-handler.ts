import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@impactalign/types';
import { HttpError } from './http-error';

function requestIdOf(req: { id?: unknown }): string {
  return typeof req.id === 'string' ? req.id : 'unknown';
}

function send(
  res: Parameters<RequestHandler>[1],
  req: Parameters<RequestHandler>[0],
  status: number,
  code: string,
  message: string,
): void {
  const body: ApiErrorBody = { error: { code, message, requestId: requestIdOf(req) } };
  res.status(status).json(body);
}

export const notFoundHandler: RequestHandler = (req, res) => {
  send(res, req, 404, 'NOT_FOUND', 'Route not found');
};

/**
 * Final error handler. Known client errors get a stable code; anything else is a 500 whose
 * details are logged server-side only — stack traces and messages never reach the client.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    send(res, req, err.status, err.code, err.message);
    return;
  }

  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.too.large') {
    send(res, req, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    return;
  }
  if (type === 'entity.parse.failed') {
    send(res, req, 400, 'INVALID_JSON', 'Request body is not valid JSON');
    return;
  }

  req.log.error({ err }, 'Unhandled error');
  send(res, req, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
};
