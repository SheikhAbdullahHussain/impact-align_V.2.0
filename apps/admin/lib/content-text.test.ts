import { describe, expect, it } from 'vitest';
import { blocksToText, paragraphsToText, textToBlocks, textToParagraphs } from './content-text';

describe('content text', () => {
  it('turns text into paragraphs and bullet lists and back', () => {
    const blocks = textToBlocks('First paragraph.\n\n- one\n- two\n\nLast one.');
    expect(blocks).toEqual(['First paragraph.', ['one', 'two'], 'Last one.']);
    expect(blocksToText(blocks)).toBe('First paragraph.\n\n- one\n- two\n\nLast one.');
  });

  it('ignores empty lines and Windows line endings', () => {
    expect(textToBlocks('\r\n\r\nA\r\n\r\n\r\n- x\r\n- y\r\n')).toEqual(['A', ['x', 'y']]);
    expect(textToBlocks('   ')).toEqual([]);
  });

  it('splits plain paragraphs', () => {
    expect(textToParagraphs('a\n\nb\n\n\nc')).toEqual(['a', 'b', 'c']);
    expect(paragraphsToText(['a', 'b'])).toBe('a\n\nb');
  });
});
