import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { SdgIndicatorRecord, SdgRecord, SdgRepository, SdgTargetRecord } from '../data/repositories';
import { createSdgsRouter } from './sdgs.router';
import { SdgsService } from './sdgs.service';

const now = new Date('2026-01-01T00:00:00Z');
const base = { title: null, description: null, officialUrl: null, metadata: null, createdAt: now, updatedAt: now };

const sdgs: SdgRecord[] = Array.from({ length: 17 }, (_, i) => ({
  ...base,
  id: `sdg-${i + 1}`,
  number: i + 1,
  code: `SDG-${String(i + 1).padStart(2, '0')}`,
}));
const targets: SdgTargetRecord[] = [{ ...base, id: 't1', sdgId: 'sdg-1', code: '1.1' }];
const indicators: SdgIndicatorRecord[] = [
  { ...base, id: 'i1', sdgId: 'sdg-1', targetId: 't1', code: '1.1.1' },
];

const repo: SdgRepository = {
  listSDGs: async () => sdgs,
  findSDGByNumber: async (n) => sdgs.find((s) => s.number === n) ?? null,
  listTargetsBySdgId: async (id) => targets.filter((t) => t.sdgId === id),
  listIndicatorsBySdgId: async (id) => indicators.filter((i) => i.sdgId === id),
};

const app = express();
app.use('/api/v1/sdgs', createSdgsRouter(new SdgsService(repo)));

describe('SDG routes', () => {
  it('lists all 17 SDGs with null placeholders', async () => {
    const res = await request(app).get('/api/v1/sdgs');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(17);
    expect(res.body.data[0]).toMatchObject({ number: 1, code: 'SDG-01', title: null });
  });

  it('does not leak internal fields', async () => {
    const res = await request(app).get('/api/v1/sdgs/1');
    expect(res.body.data).not.toHaveProperty('metadata');
    expect(res.body.data).not.toHaveProperty('createdAt');
  });

  it('returns one SDG by number', async () => {
    const res = await request(app).get('/api/v1/sdgs/17');
    expect(res.status).toBe(200);
    expect(res.body.data.number).toBe(17);
  });

  it.each(['0', '18', 'abc', '01'])('returns 400 for id %s', async (id) => {
    const res = await request(app).get(`/api/v1/sdgs/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns targets and indicators of an SDG', async () => {
    const t = await request(app).get('/api/v1/sdgs/1/targets');
    expect(t.status).toBe(200);
    expect(t.body.data).toHaveLength(1);
    const i = await request(app).get('/api/v1/sdgs/1/indicators');
    expect(i.body.data[0]).toMatchObject({ code: '1.1.1', targetId: 't1' });
  });

  it('returns empty lists for an SDG without targets yet', async () => {
    const res = await request(app).get('/api/v1/sdgs/2/targets');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('is read-only', async () => {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const res = await request(app)[method]('/api/v1/sdgs/1');
      expect(res.status).toBe(404);
    }
  });
});