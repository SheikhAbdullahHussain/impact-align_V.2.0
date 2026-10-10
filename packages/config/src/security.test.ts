import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, staticSecurityHeaders } from './security';

describe('buildContentSecurityPolicy', () => {
  it('is nonce-based and blocks framing, plugins and unsafe-eval in production', () => {
    const csp = buildContentSecurityPolicy({ nonce: 'abc123', isDev: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('unsafe-inline');
  });

  it('only relaxes eval/inline styles in development', () => {
    const csp = buildContentSecurityPolicy({ nonce: 'n', isDev: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('allows only listed connect-src origins', () => {
    const csp = buildContentSecurityPolicy({
      nonce: 'n',
      isDev: false,
      connectSrc: ['https://api.example.org'],
    });
    expect(csp).toContain("connect-src 'self' https://api.example.org");
  });

  it('ships the baseline static headers', () => {
    const keys = staticSecurityHeaders.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
      ]),
    );
  });
});
