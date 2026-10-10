export interface CspOptions {
  readonly nonce: string;
  readonly isDev: boolean;
  /** Origins the browser may call with fetch/XHR (e.g. the API). */
  readonly connectSrc?: readonly string[];
}

/**
 * Strict, nonce-based Content-Security-Policy for the Next.js apps.
 * `unsafe-eval` / inline styles are allowed in development only (React refresh, HMR).
 */
export function buildContentSecurityPolicy({ nonce, isDev, connectSrc = [] }: CspOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", ...(isDev ? ["'unsafe-inline'"] : [`'nonce-${nonce}'`])],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...connectSrc],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(isDev ? {} : { 'upgrade-insecure-requests': [] }),
  };
  return Object.entries(directives)
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(' ')}` : name))
    .join('; ');
}

export interface HeaderEntry {
  readonly key: string;
  readonly value: string;
}

/** Static security headers applied to every Next.js response (CSP is added per-request). */
export const staticSecurityHeaders: readonly HeaderEntry[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** Per-request CSP nonce (base64 of a random UUID), usable in Node and Edge runtimes. */
export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}
