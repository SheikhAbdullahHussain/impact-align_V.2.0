import { z } from 'zod';

/** Route param: SDG number 1-17, parsed to a number. */
export const sdgNumberParamSchema = z.object({
  id: z
    .string()
    .regex(/^(?:[1-9]|1[0-7])$/, 'id must be an SDG number from 1 to 17')
    .transform(Number),
});

export type SdgNumberParam = z.infer<typeof sdgNumberParamSchema>;