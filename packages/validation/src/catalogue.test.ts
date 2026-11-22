import { describe, expect, it } from 'vitest';
import { catalogueImportSchema, sdgNumberOfCode, targetCodeOfIndicator } from './catalogue';

describe('catalogue codes', () => {
  it('derives the goal and the target from a code', () => {
    expect(sdgNumberOfCode('17.19')).toBe(17);
    expect(sdgNumberOfCode('6.1.1')).toBe(6);
    expect(targetCodeOfIndicator('6.a.1')).toBe('6.a');
  });
});

describe('catalogueImportSchema', () => {
  it('accepts codes only, with every list optional', () => {
    const result = catalogueImportSchema.parse({
      targets: [{ code: '6.1' }, { code: '6.a' }],
      indicators: [{ code: '6.1.1' }],
    });
    expect(result.sdgs).toEqual([]);
    expect(result.indicators).toHaveLength(1);
    expect(catalogueImportSchema.parse({})).toEqual({ sdgs: [], targets: [], indicators: [] });
  });

  it.each([
    [{ targets: [{ code: '18.1' }] }],
    [{ targets: [{ code: '6' }] }],
    [{ targets: [{ code: '6.1.1' }] }],
    [{ indicators: [{ code: '6.1' }] }],
    [{ sdgs: [{ number: 18 }] }],
    [{ targets: [{ code: '6.1', extra: true }] }],
  ])('rejects malformed input %#', (input) => {
    expect(catalogueImportSchema.safeParse(input).success).toBe(false);
  });

  it('rejects duplicate codes', () => {
    const result = catalogueImportSchema.safeParse({ targets: [{ code: '6.1' }, { code: '6.1' }] });
    expect(result.success).toBe(false);
  });
});
