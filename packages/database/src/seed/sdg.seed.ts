import { SDG } from '../models/sdg.models';

const SDG_RECORDS = Array.from({ length: 17 }, (_, index) => {
  const number = index + 1;

  return {
    number,
    code: `SDG-${String(number).padStart(2, '0')}`,
  };
});

/**
 * Creates the 17 SDG catalogue records.
 * Safe to execute repeatedly without creating duplicates.
 *
 * Official titles, descriptions, targets and indicators
 * must be populated from verified official sources.
 */
export async function seedSDGs(): Promise<number> {
  const operations = SDG_RECORDS.map((record) => ({
    updateOne: {
      filter: { number: record.number },
      update: {
        $setOnInsert: {
          ...record,
          title: null,
          description: null,
          officialUrl: null,
          metadata: null,
          deletedAt: null,
        },
      },
      upsert: true,
    },
  }));

  const result = await SDG.bulkWrite(operations);

  return result.upsertedCount;
}

export { SDG_RECORDS };