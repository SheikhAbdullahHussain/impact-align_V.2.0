/** Renders admin-written plain text: "## heading", "- bullet", blank line between paragraphs. */
export function LegalBody({ text }: { readonly text: string }) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 leading-7 text-navy-800">
      {blocks.map((block, index) => {
        if (block.startsWith('## ')) {
          return (
            <h2 key={index} className="pt-4 font-serif text-2xl font-bold text-navy-900">
              {block.slice(3).trim()}
            </h2>
          );
        }
        const lines = block.split('\n');
        if (lines.every((line) => line.trim().startsWith('- '))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.trim().slice(2).trim()}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}
