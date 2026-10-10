import { z } from 'zod';
import type { HealthCheckResult, LivenessResult } from '@impactalign/types';

export const healthCheckResultSchema = z.object({
  status: z.enum(['ok', 'down']),
  check: z.enum(['liveness', 'database', 'redis']),
  timestamp: z.iso.datetime(),
  latencyMs: z.number().nonnegative().optional(),
}) satisfies z.ZodType<HealthCheckResult>;

export const livenessResultSchema = z.object({
  status: z.enum(['ok', 'down']),
  check: z.literal('liveness'),
  timestamp: z.iso.datetime(),
  latencyMs: z.number().nonnegative().optional(),
  service: z.string().min(1),
  version: z.string().min(1),
  uptimeSeconds: z.number().nonnegative(),
}) satisfies z.ZodType<LivenessResult>;
