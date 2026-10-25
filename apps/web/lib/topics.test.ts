import { describe, expect, it } from 'vitest';
import { dashboardNav } from '@impactalign/config';
import { dashboardContent } from './dashboard-content';
import { sections } from './section-content';
import { allTopicPaths, findTopic, slugify, topicHref } from './topics';

describe('slugify', () => {
  it('produces clean URL slugs', () => {
    expect(slugify('Vision & Mission')).toBe('vision-and-mission');
    expect(slugify('What is ImpactAlign?')).toBe('what-is-impactalign');
    expect(slugify('Events & Webinars')).toBe('events-and-webinars');
  });
});

describe('topics', () => {
  it('has unique slugs within every section', () => {
    for (const section of sections) {
      const slugs = section.topics.map((t) => slugify(t.title));
      expect(new Set(slugs).size, section.slug).toBe(slugs.length);
    }
  });

  it('resolves every listed topic and rejects unknown ones', () => {
    expect(allTopicPaths.length).toBeGreaterThan(40);
    for (const section of sections) {
      for (const topic of section.topics) {
        const [, s, t] = topicHref(section, topic).split('/');
        expect(findTopic(s ?? '', t ?? '')?.topic.title).toBe(topic.title);
      }
    }
    expect(findTopic('about', 'does-not-exist')).toBeNull();
    expect(findTopic('nope', 'governance')).toBeNull();
  });
});

describe('dashboard content', () => {
  it('has content for every dashboard route except the overview', () => {
    for (const item of dashboardNav.filter((n) => n.href !== '/dashboard')) {
      expect(dashboardContent[item.href], item.href).toBeDefined();
    }
  });
});
