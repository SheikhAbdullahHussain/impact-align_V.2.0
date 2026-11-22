import { z } from 'zod';

const SDG_PART = '(?:[1-9]|1[0-7])';
const TARGET_PART = '(?:\\d{1,2}|[a-z])';
const TARGET_CODE = new RegExp(`^${SDG_PART}\\.${TARGET_PART}$`);
const INDICATOR_CODE = new RegExp(`^${SDG_PART}\\.${TARGET_PART}\\.\\d{1,2}$`);

/** "6.1" -> 6, "6.1.1" -> 6 */
export const sdgNumberOfCode = (code: string): number => Number(code.split('.')[0]);
/** "6.1.1" -> "6.1" */
export const targetCodeOfIndicator = (code: string): string =>
  code.split('.').slice(0, 2).join('.');

const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable().optional();

const sdgEntry = z
  .object({
    number: z.number().int().min(1).max(17),
    title: optionalText(300),
    description: optionalText(5000),
    officialUrl: optionalText(500),
  })
  .strict();

const targetEntry = z
  .object({
    code: z.string().trim().regex(TARGET_CODE, 'Target code must look like 6.1 or 6.a'),
    title: optionalText(500),
    description: optionalText(5000),
    officialUrl: optionalText(500),
  })
  .strict();

const indicatorEntry = z
  .object({
    code: z.string().trim().regex(INDICATOR_CODE, 'Indicator code must look like 6.1.1'),
    title: optionalText(500),
    description: optionalText(5000),
    officialUrl: optionalText(500),
  })
  .strict();

const findDuplicate = (codes: string[]) =>
  codes.find((code, index) => codes.indexOf(code) !== index);

/** File format accepted by the catalogue import script. Only codes are required. */
export const catalogueImportSchema = z
  .object({
    sdgs: z.array(sdgEntry).default([]),
    targets: z.array(targetEntry).default([]),
    indicators: z.array(indicatorEntry).default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    const checks: [string, string[]][] = [
      ['sdgs', data.sdgs.map((s) => String(s.number))],
      ['targets', data.targets.map((t) => t.code)],
      ['indicators', data.indicators.map((i) => i.code)],
    ];
    for (const [path, codes] of checks) {
      const duplicate = findDuplicate(codes);
      if (duplicate)
        ctx.addIssue({ code: 'custom', path: [path], message: `Duplicate entry: ${duplicate}` });
    }
  });

export type CatalogueImport = z.infer<typeof catalogueImportSchema>;
