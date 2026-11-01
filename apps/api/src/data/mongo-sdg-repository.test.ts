import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SDG, SDGIndicator, SDGTarget } from '@impactalign/database';
import { createMongoRepositories } from './mongo-repositories';

afterEach(() => vi.restoreAllMocks());

/** Chainable, awaitable stand-in for a Mongoose query (.sort().lean() etc. all return itself). */
const query = (value: unknown): never => {
  const q: unknown = new Proxy(() => undefined, {
    get: (_target, prop) =>
      prop === 'then'
        ? (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(value).then(resolve, reject)
        : () => q,
  });
  return q as never;
};

const firstFilter = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls[0]![0] as Record<string, unknown>;

describe('mongo SDG repository: soft-deleted rows are never returned', () => {
  it('listSDGs filters deletedAt: null', async () => {
    const spy = vi.spyOn(SDG, 'find').mockImplementation((() => query([])) as never);
    await createMongoRepositories().sdgs.listSDGs();
    expect(firstFilter(spy)['deletedAt']).toBeNull();
  });

  it('findSDGByNumber filters deletedAt: null', async () => {
    const spy = vi.spyOn(SDG, 'findOne').mockImplementation((() => query(null)) as never);
    expect(await createMongoRepositories().sdgs.findSDGByNumber(1)).toBeNull();
    const filter = firstFilter(spy);
    expect(filter['number']).toBe(1);
    expect(filter['deletedAt']).toBeNull();
  });

  it('listTargetsBySdgId filters deletedAt: null', async () => {
    const spy = vi.spyOn(SDGTarget, 'find').mockImplementation((() => query([])) as never);
    await createMongoRepositories().sdgs.listTargetsBySdgId(new Types.ObjectId().toHexString());
    expect(firstFilter(spy)['deletedAt']).toBeNull();
  });

  it('listIndicatorsBySdgId filters deletedAt: null', async () => {
    const spy = vi.spyOn(SDGIndicator, 'find').mockImplementation((() => query([])) as never);
    await createMongoRepositories().sdgs.listIndicatorsBySdgId(new Types.ObjectId().toHexString());
    expect(firstFilter(spy)['deletedAt']).toBeNull();
  });
});