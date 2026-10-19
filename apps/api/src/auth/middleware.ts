import type { Request, RequestHandler } from 'express';
import { hasPlatformPermission, safeEqual } from '@impactalign/auth';
import type { Permission } from '@impactalign/types';
import { HttpError } from '../common/http-error';
import type { AuthService, RequestContext } from './auth.service';
import { clearSessionCookie, type CookieSettings } from './cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requestContext(req: Request): RequestContext {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 300),
    requestId: typeof req.id === 'string' ? req.id : undefined,
  };
}

/** Loads the signed-in user (if any) from the session cookie into req.auth. */
export function authenticate(auth: AuthService, cookie: CookieSettings): RequestHandler {
  return async (req, res, next) => {
    const token: unknown = req.cookies?.[cookie.name];
    if (typeof token === 'string') {
      const context = await auth.authenticate(token);
      if (context) req.auth = context;
      else clearSessionCookie(res, cookie); // stale cookie: drop it
    }
    next();
  };
}

export const requireAuth: RequestHandler = (req, _res, next) =>
  req.auth ? next() : next(new HttpError(401, 'UNAUTHENTICATED', 'Sign in required'));

/** Platform-level permission check (server-side; never trust the client's idea of its role). */
export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new HttpError(401, 'UNAUTHENTICATED', 'Sign in required'));
    if (!hasPlatformPermission(req.auth.user.roles, permission)) {
      return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to do this'));
    }
    next();
  };
}

/**
 * CSRF protection for cookie sessions: every state-changing request from a signed-in user must send
 * the session's CSRF token in X-CSRF-Token (a cross-site page cannot read or set it).
 */
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method) || !req.auth) return next();
  const sent = req.get('x-csrf-token');
  if (!sent || !safeEqual(sent, req.auth.session.csrfToken)) {
    return next(new HttpError(403, 'CSRF_FAILED', 'Missing or invalid CSRF token'));
  }
  next();
};

/** Rejects browser requests from origins that are not on the allow-list. */
export function originGuard(allowedOrigins: ReadonlySet<string>): RequestHandler {
  return (req, _res, next) => {
    const origin = req.get('origin');
    if (!SAFE_METHODS.has(req.method) && origin && !allowedOrigins.has(origin)) {
      return next(new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origin not allowed'));
    }
    next();
  };
}

/** Bodies must be JSON: blocks form-style cross-site posts (which cannot send JSON without CORS). */
export const requireJson: RequestHandler = (req, _res, next) =>
  req.is('application/json') === false
    ? next(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the body as application/json'))
    : next();
