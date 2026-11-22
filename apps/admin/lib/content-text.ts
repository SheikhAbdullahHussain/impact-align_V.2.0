export type Block = string | string[];

/** Admin text to FAQ blocks: blank line = new paragraph; lines that all start with "- " = bullet list. */
export function textToBlocks(text: string): Block[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim());
      return lines.every((line) => line.startsWith('- '))
        ? lines.map((line) => line.slice(2).trim()).filter(Boolean)
        : block;
    });
}

export function blocksToText(blocks: readonly Block[]): string {
  return blocks
    .map((block) => (Array.isArray(block) ? block.map((item) => `- ${item}`).join('\n') : block))
    .join('\n\n');
}

export const textToParagraphs = (text: string): string[] =>
  text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

export const paragraphsToText = (paragraphs: readonly string[]): string => paragraphs.join('\n\n');
