import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const commaSeparatedUrls = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()).min(1));

const PLACEHOLDER_MARKER = 'change-me';

/** Environment contract for apps/api. Parsed once at startup; the process exits on failure. */
export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_HOST: z.string().min(1).default('0.0.0.0'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    API_CORS_ORIGINS: commaSeparatedUrls,
    API_TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    API_SWAGGER_ENABLED: booleanString.default(false),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
    HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(2_000),
    MONGODB_URI: z
      .string()
      .min(1)
      .refine((v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'), {
        message: 'must start with mongodb:// or mongodb+srv://',
      }),
    REDIS_URL: z
      .string()
      .min(1)
      .refine((v) => v.startsWith('redis://') || v.startsWith('rediss://'), {
        message: 'must start with redis:// or rediss://',
      }),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    const addIssue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });

    if (env.MONGODB_URI.includes(PLACEHOLDER_MARKER)) {
      addIssue('MONGODB_URI', 'contains a placeholder credential; set a real secret');
    }
    if (env.REDIS_URL.includes(PLACEHOLDER_MARKER)) {
      addIssue('REDIS_URL', 'contains a placeholder credential; set a real secret');
    }
    if (env.API_CORS_ORIGINS.some((origin) => !origin.startsWith('https://'))) {
      addIssue('API_CORS_ORIGINS', 'must use https:// origins in production');
    }
    if (env.API_SWAGGER_ENABLED) {
      addIssue('API_SWAGGER_ENABLED', 'API docs UI must be disabled in production');
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export class EnvValidationError extends Error {
  readonly issues: readonly string[];
  constructor(scope: string, issues: readonly string[]) {
    super(`Invalid ${scope} environment:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

function formatIssues(error: z.ZodError): string[] {
  // Only variable names and messages — never the offending values (they may be secrets).
  return error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`);
}

export function parseApiEnv(source: Record<string, string | undefined>): ApiEnv {
  const result = apiEnvSchema.safeParse(source);
  if (!result.success) throw new EnvValidationError('API', formatIssues(result.error));
  return result.data;
}

/** Environment contract for the Next.js apps (public values only — never secrets). */
export const webEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:4000'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(source: Record<string, string | undefined>): WebEnv {
  const result = webEnvSchema.safeParse(source);
  if (!result.success) throw new EnvValidationError('web', formatIssues(result.error));
  return result.data;
}
