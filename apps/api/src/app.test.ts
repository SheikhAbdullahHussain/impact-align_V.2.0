import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from './test-utils';

describe('API hardening', () => {
  const app = buildTestApp();

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('returns a JSON 404 envelope with a request id', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('echoes a well-formed X-Request-Id and replaces a malformed one', async () => {
    const good = await request(app).get('/health').set('X-Request-Id', 'abcd-1234-efgh');
    expect(good.headers['x-request-id']).toBe('abcd-1234-efgh');
    const bad = await request(app).get('/health').set('X-Request-Id', 'bad id <script>');
    expect(bad.headers['x-request-id']).not.toContain('<script>');
  });

  it('only allows configured CORS origins', async () => {
    const allowed = await request(app).get('/health').set('Origin', 'http://localhost:3000');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    const denied = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects oversized bodies with 413 and malformed JSON with 400', async () => {
    const big = await request(app)
      .post('/anything')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ blob: 'x'.repeat(200_000) }));
    expect(big.status).toBe(413);
    const bad = await request(app)
      .post('/anything')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_JSON');
  });

  it('rate limits non-health routes but never health probes', async () => {
    const limited = buildTestApp({}, { RATE_LIMIT_MAX: '2' });
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) statuses.push((await request(limited).get('/nope')).status);
    expect(statuses).toEqual([404, 404, 429, 429]);
    for (let i = 0; i < 5; i += 1) {
      expect((await request(limited).get('/health')).status).toBe(200);
    }
  });

  it('does not expose API docs unless explicitly enabled', async () => {
    expect((await request(app).get('/docs/openapi.json')).status).toBe(404);
    const withDocs = buildTestApp({}, { API_SWAGGER_ENABLED: 'true' });
    expect((await request(withDocs).get('/docs/openapi.json')).status).toBe(200);
  });
});
