import { z } from 'zod';

export const clarificationSchema = z
  .object({ message: z.string().trim().min(10).max(2000) })
  .strict();

export const decisionSchema = z
  .object({
    decision: z.enum(['VERIFIED', 'REJECTED']),
    rationale: z.string().trim().min(20).max(4000),
  })
  .strict();