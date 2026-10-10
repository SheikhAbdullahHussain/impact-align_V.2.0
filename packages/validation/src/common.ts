import { z } from 'zod';

/** MongoDB ObjectId as a 24-char hex string. */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
