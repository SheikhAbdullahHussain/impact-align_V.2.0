import { describe, expect, it } from 'vitest';
import { joinNav, legalPages, loginNav, publicNav, siteConfig } from './site';

describe('site config', () => {
  it('keeps the brand navigation order', () => {
    const labels = [...publicNav, loginNav, joinNav].map((item) => item.label);
    expect(labels).toEqual([
      'HOME',
      'ABOUT',
      'SDGs',
      'HOW IT WORKS',
      'PLATFORM',
      'RESOURCES',
      'COMMUNITY',
      'LOGIN',
      'JOIN IMPACTALIGN',
    ]);
    expect(siteConfig.primaryCta.label).toBe('JOIN IMPACTALIGN');
  });

  it('defines all nine legal placeholder pages with unique slugs', () => {
    const slugs = legalPages.map((p) => p.slug);
    expect(slugs).toEqual([
      'privacy',
      'terms',
      'cookies',
      'ai-ethics',
      'data-protection',
      'accessibility',
      'security',
      'acceptable-use',
      'disclaimer',
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
