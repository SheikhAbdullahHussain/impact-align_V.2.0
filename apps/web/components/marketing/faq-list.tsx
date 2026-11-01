import type { FaqGroup } from '@/lib/faq-content';

export function FaqList({ groups }: { readonly groups: readonly FaqGroup[] }) {
  return (
    <div>
      <nav aria-label="FAQ topics">
        <ul className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <li key={group.id}>
              <a
                href={`#${group.id}`}
                className="block rounded-full border border-navy-100 bg-white px-3 py-1.5 text-sm font-semibold text-navy-900 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                {group.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {groups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-heading`}
          className="mt-10 scroll-mt-24"
        >
          <h2
            id={`${group.id}-heading`}
            className="font-serif text-2xl font-bold text-navy-900"
          >
            {group.title}
          </h2>
          <div className="mt-4 divide-y divide-navy-100 rounded-lg border border-navy-100 bg-white">
            {group.items.map((item) => (
              <details key={item.number} className="p-4">
                <summary className="cursor-pointer font-semibold text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
                  <span className="mr-2 text-gold-700">{item.number}.</span>
                  {item.question}
                </summary>
                <div className="mt-3 space-y-3 leading-7 text-navy-800">
                  {item.answer.map((block) =>
                    typeof block === 'string' ? (
                      <p key={block}>{block}</p>
                    ) : (
                      <ul key={block.join('|')} className="list-disc space-y-1 pl-6">
                        {block.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}