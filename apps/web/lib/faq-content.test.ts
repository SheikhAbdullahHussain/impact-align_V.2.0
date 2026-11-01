import { describe, expect, it } from 'vitest';
import { FAQ_COUNT, faqGroups } from './faq-content';

const items = faqGroups.flatMap((group) => group.items);

describe('faq content', () => {
  it('holds all 47 questions, numbered 1 to 47 in order', () => {
    expect(FAQ_COUNT).toBe(47);
    expect(items.map((item) => item.number)).toEqual(Array.from({ length: 47 }, (_, n) => n + 1));
  });

  it('has unique group ids and no empty questions or answers', () => {
    const ids = faqGroups.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of items) {
      expect(item.question.trim()).not.toBe('');
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });
});