import { z } from 'zod';

export const projectInputSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    summary: z.string().trim().max(2000).default(''),
    sdgNumbers: z
      .array(z.number().int().min(1).max(17))
      .max(17)
      .default([])
      .transform((numbers) => [...new Set(numbers)].sort((a, b) => a - b)),
  })
  .strict();

export type ProjectInput = z.infer<typeof projectInputSchema>;