import type { Types } from 'mongoose';
import { SDG, SDGIndicator, SDGTarget } from '../models/sdg.models';

interface CatalogueText {
  title?: string | null | undefined;
  description?: string | null | undefined;
  officialUrl?: string | null | undefined;
}

export interface CatalogueData {
  sdgs: ({ number: number } & CatalogueText)[];
  targets: ({ code: string } & CatalogueText)[];
  indicators: ({ code: string } & CatalogueText)[];
}

export interface CatalogueImportResult {
  sdgsUpdated: number;
  targetsCreated: number;
  targetsUpdated: number;
  indicatorsCreated: number;
  indicatorsUpdated: number;
}

/** Only the fields present in the file are written, so a re-run never wipes existing text. */
const textFields = (item: CatalogueText): Record<string, string | null> => {
  const fields: Record<string, string | null> = {};
  if (item.title !== undefined) fields['title'] = item.title;
  if (item.description !== undefined) fields['description'] = item.description;
  if (item.officialUrl !== undefined) fields['officialUrl'] = item.officialUrl;
  return fields;
};

const sdgOf = (code: string): number => Number(code.split('.')[0]);
const targetOf = (code: string): string => code.split('.').slice(0, 2).join('.');
const key = (sdgId: Types.ObjectId, code: string): string => `${sdgId.toHexString()}:${code}`;

/**
 * Imports SDG titles, targets and indicators. Safe to run repeatedly. Requires the 17 SDG records
 * (seedSDGs) and rejects an indicator whose target is neither in the file nor already imported.
 */
export async function importCatalogue(data: CatalogueData): Promise<CatalogueImportResult> {
  const sdgs = await SDG.find({ deletedAt: null }).lean<
    { _id: Types.ObjectId; number: number }[]
  >();
  if (sdgs.length === 0) throw new Error('No SDG records found. Run the SDG seed first.');
  const sdgIdByNumber = new Map(sdgs.map((sdg) => [sdg.number, sdg._id]));
  const sdgIdOf = (number: number): Types.ObjectId => {
    const id = sdgIdByNumber.get(number);
    if (!id) throw new Error(`SDG ${number} does not exist. Run the SDG seed first.`);
    return id;
  };

  const existing = await SDGTarget.find({ deletedAt: null }).lean<
    { _id: Types.ObjectId; sdgId: Types.ObjectId; code: string }[]
  >();
  const knownTargets = new Set(existing.map((t) => key(t.sdgId, t.code)));
  for (const target of data.targets)
    knownTargets.add(key(sdgIdOf(sdgOf(target.code)), target.code));
  const missing = data.indicators
    .filter((i) => !knownTargets.has(key(sdgIdOf(sdgOf(i.code)), targetOf(i.code))))
    .map((i) => `${i.code} (needs target ${targetOf(i.code)})`);
  if (missing.length > 0) {
    throw new Error(`Indicators without a target: ${missing.slice(0, 10).join(', ')}`);
  }

  const result: CatalogueImportResult = {
    sdgsUpdated: 0,
    targetsCreated: 0,
    targetsUpdated: 0,
    indicatorsCreated: 0,
    indicatorsUpdated: 0,
  };

  const sdgOps = data.sdgs
    .filter((sdg) => Object.keys(textFields(sdg)).length > 0)
    .map((sdg) => ({
      updateOne: { filter: { number: sdg.number }, update: { $set: textFields(sdg) } },
    }));
  if (sdgOps.length > 0) result.sdgsUpdated = (await SDG.bulkWrite(sdgOps)).modifiedCount;

  if (data.targets.length > 0) {
    const written = await SDGTarget.bulkWrite(
      data.targets.map((target) => ({
        updateOne: {
          filter: { sdgId: sdgIdOf(sdgOf(target.code)), code: target.code },
          update: { $set: { ...textFields(target), deletedAt: null } },
          upsert: true,
        },
      })),
    );
    result.targetsCreated = written.upsertedCount;
    result.targetsUpdated = written.modifiedCount;
  }

  if (data.indicators.length > 0) {
    const targets = await SDGTarget.find({ deletedAt: null }).lean<
      { _id: Types.ObjectId; sdgId: Types.ObjectId; code: string }[]
    >();
    const targetIdByKey = new Map(targets.map((t) => [key(t.sdgId, t.code), t._id]));
    const written = await SDGIndicator.bulkWrite(
      data.indicators.map((indicator) => {
        const sdgId = sdgIdOf(sdgOf(indicator.code));
        return {
          updateOne: {
            filter: { sdgId, code: indicator.code },
            update: {
              $set: {
                ...textFields(indicator),
                targetId: targetIdByKey.get(key(sdgId, targetOf(indicator.code))) ?? null,
                deletedAt: null,
              },
            },
            upsert: true,
          },
        };
      }),
    );
    result.indicatorsCreated = written.upsertedCount;
    result.indicatorsUpdated = written.modifiedCount;
  }

  return result;
}
