import type { RequestHandler } from 'express';
import { HttpError } from './http-error';

/** Anything with Zod's safeParse shape (keeps this file free of a direct zod dependency). */
export interface BodySchema<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

/**
 * Validates req.body against a schema and replaces it with the parsed result.
 * Error details contain field paths and messages only — never the submitted values.
 */
export function validateBody<T>(schema: BodySchema<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      }));
      return next(new HttpError(400, 'VALIDATION_ERROR', 'Invalid request', details));
    }
    req.body = result.data;
    next();
  };
}

/** Route parameter must be a valid id; anything else is reported as "not found" (no probing). */
export function validateIdParam(name: string, isValid: (value: string) => boolean): RequestHandler {
  return (req, _res, next) => {
    const value = req.params[name];
    return typeof value === 'string' && isValid(value) ? next() : next(HttpError.notFound());
  };
}
