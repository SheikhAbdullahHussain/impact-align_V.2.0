import type { Response } from 'express';
import type { ApiEnv } from '@impactalign/config';

export interface CookieSettings {
  name: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

/**
 * Session cookie: HttpOnly (no JavaScript access), Secure in production, and in production it uses
 * the __Host- prefix (forces Secure, Path=/, no Domain) so subdomains cannot overwrite it.
 */
export function cookieSettings(env: Pick<ApiEnv, 'NODE_ENV' | 'COOKIE_SAME_SITE'>): CookieSettings {
  const secure = env.NODE_ENV === 'production';
  return {
    name: secure ? '__Host-ia_session' : 'ia_session',
    secure,
    sameSite: env.COOKIE_SAME_SITE,
  };
}

const baseOptions = (s: CookieSettings) =>
  ({ httpOnly: true, secure: s.secure, sameSite: s.sameSite, path: '/' }) as const;

export function setSessionCookie(
  res: Response,
  s: CookieSettings,
  token: string,
  expires: Date,
): void {
  res.cookie(s.name, token, { ...baseOptions(s), expires });
}

export function clearSessionCookie(res: Response, s: CookieSettings): void {
  res.clearCookie(s.name, baseOptions(s));
}
