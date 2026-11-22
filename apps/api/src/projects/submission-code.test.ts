import { describe, expect, it } from 'vitest';
import { SUBMISSION_CODE_PATTERN, generateSubmissionCode } from './submission-code';

describe('generateSubmissionCode', () => {
  it('always matches the IASDG-XXXXXX format', () => {
    for (let index = 0; index < 200; index += 1) {
      expect(generateSubmissionCode()).toMatch(SUBMISSION_CODE_PATTERN);
    }
  });

  it('does not repeat in a small sample', () => {
    const codes = new Set(Array.from({ length: 200 }, generateSubmissionCode));
    expect(codes.size).toBe(200);
  });
});
