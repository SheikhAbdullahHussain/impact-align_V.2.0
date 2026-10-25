import { Router, type RequestHandler } from 'express';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@impactalign/validation';
import type { AuthResponse } from '@impactalign/types';
import { validateBody } from '../common/validate';
import type { AuthService } from './auth.service';
import { clearSessionCookie, setSessionCookie, type CookieSettings } from './cookies';
import { requestContext, requireAuth } from './middleware';
import { toPublicUser } from './public-user';

export interface AuthRouterDeps {
  auth: AuthService;
  cookie: CookieSettings;
  /** Tight per-IP limiter for credential endpoints. */
  limiter: RequestHandler;
}

export function createAuthRouter({ auth, cookie, limiter }: AuthRouterDeps): Router {
  const router = Router();

  router.post('/register', limiter, validateBody(registerSchema), async (req, res) => {
    await auth.register(req.body, requestContext(req));
    // Identical response whether or not the address is already registered.
    res
      .status(202)
      .json({ message: 'If this address can be used, a verification email has been sent.' });
  });

  router.post('/verify-email', limiter, validateBody(verifyEmailSchema), async (req, res) => {
    await auth.verifyEmail(req.body.token, requestContext(req));
    res.json({ message: 'Email verified. You can now sign in.' });
  });

  router.post('/login', limiter, validateBody(loginSchema), async (req, res) => {
    const result = await auth.login(req.body, requestContext(req));
    setSessionCookie(res, cookie, result.sessionToken, result.expiresAt);
    const body: AuthResponse = { user: toPublicUser(result.user), csrfToken: result.csrfToken };
    res.json(body);
  });

  router.post('/logout', requireAuth, async (req, res) => {
    await auth.logout(req.auth!, requestContext(req));
    clearSessionCookie(res, cookie);
    res.status(204).end();
  });

  router.get('/me', requireAuth, (req, res) => {
    const body: AuthResponse = {
      user: toPublicUser(req.auth!.user),
      csrfToken: req.auth!.session.csrfToken,
    };
    res.json(body);
  });

  router.post('/forgot-password', limiter, validateBody(forgotPasswordSchema), async (req, res) => {
    await auth.forgotPassword(req.body.email);
    res
      .status(202)
      .json({ message: 'If an account exists for this address, a reset link has been sent.' });
  });

  router.post('/reset-password', limiter, validateBody(resetPasswordSchema), async (req, res) => {
    await auth.resetPassword(req.body.token, req.body.password, requestContext(req));
    clearSessionCookie(res, cookie);
    res.json({ message: 'Password updated. Sign in with your new password.' });
  });

  router.post(
    '/change-password',
    requireAuth,
    validateBody(changePasswordSchema),
    async (req, res) => {
      await auth.changePassword(
        req.auth!,
        req.body.currentPassword,
        req.body.newPassword,
        requestContext(req),
      );
      res.status(204).end();
    },
  );

  return router;
}
