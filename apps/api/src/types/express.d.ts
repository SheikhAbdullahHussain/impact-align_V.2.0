import type { AuthContext } from '../auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware when the request carries a valid session. */
      auth?: AuthContext;
    }
  }
}

export {};
