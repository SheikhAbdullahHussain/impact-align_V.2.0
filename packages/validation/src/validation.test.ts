import { describe, expect, it } from 'vitest';
import { healthCheckResultSchema, livenessResultSchema } from './health';
import { objectIdSchema, paginationQuerySchema } from './common';

describe('objectIdSchema', () => {
  it('accepts 24-char hex and rejects injection-style input', () => {
    expect(objectIdSchema.safeParse('64b7f0c2e1a4d3a1b2c3d4e5').success).toBe(true);
    expect(objectIdSchema.safeParse('{"$ne":null}').success).toBe(false);
    expect(objectIdSchema.safeParse('short').success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('coerces strings and applies defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });
  it('caps page size', () => {
    expect(paginationQuerySchema.safeParse({ pageSize: '1000' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
  });
});

describe('health schemas', () => {
  const now = new Date().toISOString();
  it('validates dependency results', () => {
    expect(
      healthCheckResultSchema.safeParse({ status: 'ok', check: 'redis', timestamp: now }).success,
    ).toBe(true);
    expect(
      healthCheckResultSchema.safeParse({ status: 'maybe', check: 'redis', timestamp: now })
        .success,
    ).toBe(false);
  });
  it('requires liveness fields', () => {
    expect(
      livenessResultSchema.safeParse({ status: 'ok', check: 'liveness', timestamp: now }).success,
    ).toBe(false);
  });
});
