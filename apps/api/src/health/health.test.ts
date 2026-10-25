import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { healthCheckResultSchema, livenessResultSchema } from '@impactalign/validation';
import { buildTestApp } from '../test-utils';

describe('GET /health', () => {
  it('returns liveness without touching dependencies', async () => {
    const app = buildTestApp({
      pingDatabase: () => Promise.reject(new Error('db down')),
      pingRedis: () => Promise.reject(new Error('redis down')),
    });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(livenessResultSchema.parse(res.body).status).toBe('ok');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe.each([
  ['/health/database', 'database', 'pingDatabase'],
  ['/health/redis', 'redis', 'pingRedis'],
] as const)('GET %s', (path, check, probeName) => {
  it('returns 200 with latency when the dependency responds', async () => {
    const res = await request(buildTestApp()).get(path);
    expect(res.status).toBe(200);
    const body = healthCheckResultSchema.parse(res.body);
    expect(body).toMatchObject({ status: 'ok', check });
    expect(body.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns 503 and leaks no error details when the dependency fails', async () => {
    const app = buildTestApp({
      [probeName]: () =>
        Promise.reject(new Error('connect ECONNREFUSED 10.0.0.5:27017 secret-host')),
    });
    const res = await request(app).get(path);
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'down', check });
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|secret-host/);
  });

  it('returns 503 when the dependency hangs past the timeout', async () => {
    const app = buildTestApp({ [probeName]: () => new Promise<void>(() => undefined) });
    const res = await request(app).get(path);
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('down');
  });
});
