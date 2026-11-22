import { z } from 'zod';
import { SUBMISSION_TYPES } from '@impactalign/types';
import { objectIdSchema } from './common';

export const projectInputSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    summary: z.string().trim().max(2000).default(''),
    sdgNumbers: z
      .array(z.number().int().min(1).max(17))
      .max(17)
      .default([])
      .transform((numbers) => [...new Set(numbers)].sort((a, b) => a - b)),
    /** Omitted = default on create, unchanged on update. */
    submissionType: z.enum(SUBMISSION_TYPES).optional(),
    /** Omitted = none on create, unchanged on update. null = unlink. */
    organizationId: objectIdSchema.nullable().optional(),
  })
  .strict();

export type ProjectInput = z.infer<typeof projectInputSchema>;

const uniqueIds = z
  .array(objectIdSchema)
  .max(300)
  .default([])
  .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]);

export const alignmentInputSchema = z
  .object({ targetIds: uniqueIds, indicatorIds: uniqueIds })
  .strict();
export type AlignmentInput = z.infer<typeof alignmentInputSchema>;

export const evidenceIndicatorSchema = z
  .object({
    indicatorId: objectIdSchema
      .nullable()
      .transform((id) => (id === null ? null : id.toLowerCase())),
  })
  .strict();

export const submitSchema = z.object({ declaration: z.literal(true) }).strict();
