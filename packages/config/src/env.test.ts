import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseApiEnv, parseWebEnv } from './env';

const base = {
  API_CORS_ORIGINS: 'http://localhost:3000, http://localhost:3001',
  MONGODB_URI: 'mongodb://user:pw@localhost:27017/db',
  REDIS_URL: 'redis://localhost:6379',
};

describe('parseApiEnv', () => {
  it('applies defaults and parses lists', () => {
    const env = parseApiEnv(base);
    expect(env.API_PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.API_SWAGGER_ENABLED).toBe(false);
    expect(env.API_CORS_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:3001']);
  });

  it('fails when required variables are missing, naming them but never their values', () => {
    try {
      parseApiEnv({ MONGODB_URI: 'mongodb://user:supersecret@host/db' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      const message = (err as Error).message;
      expect(message).toContain('API_CORS_ORIGINS');
      expect(message).toContain('REDIS_URL');
      expect(message).not.toContain('supersecret');
    }
  });

  it('rejects connection strings with the wrong scheme', () => {
    expect(() => parseApiEnv({ ...base, MONGODB_URI: 'postgres://x' })).toThrow(/MONGODB_URI/);
    expect(() => parseApiEnv({ ...base, REDIS_URL: 'http://x' })).toThrow(/REDIS_URL/);
  });

  it('refuses unsafe settings in production', () => {
    const prod = { ...base, NODE_ENV: 'production' };
    expect(() => parseApiEnv(prod)).toThrow(/https/);
    const secure = {
      ...prod,
      API_CORS_ORIGINS: 'https://app.example.org',
      MONGODB_URI: 'mongodb://u:p@db.internal/db',
      REDIS_URL: 'rediss://:p@cache.internal:6379',
    };
    expect(parseApiEnv(secure).NODE_ENV).toBe('production');
    expect(() =>
      parseApiEnv({ ...secure, MONGODB_URI: 'mongodb://u:change-me@db.internal/db' }),
    ).toThrow(/placeholder/);
    expect(() => parseApiEnv({ ...secure, API_SWAGGER_ENABLED: 'true' })).toThrow(/disabled/);
  });
});

describe('parseWebEnv', () => {
  it('provides local defaults and validates URLs', () => {
    expect(parseWebEnv({}).NEXT_PUBLIC_API_URL).toBe('http://localhost:4000');
    expect(() => parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'not-a-url' })).toThrow(EnvValidationError);
  });
});
