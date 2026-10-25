import pino, { type Logger } from 'pino';
import type { ApiEnv } from '@impactalign/config';

export type AppLogger = Logger;

/** Structured JSON logger. Credentials and cookies are redacted from every log line. */
export function createLogger(env: Pick<ApiEnv, 'LOG_LEVEL' | 'NODE_ENV'>): AppLogger {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
    base: { service: 'impactalign-api' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  });
}
