import Link from 'next/link';
import { Container } from '@impactalign/ui';
import type { TitledItem } from '@/lib/home-content';
import type { SectionContent } from '@/lib/section-content';
import { slugify, topicHref } from '@/lib/topics';
import { PageHero } from './page-hero';

export interface TopicPageProps {
  readonly section: SectionContent;
  readonly topic: TitledItem;
}

/** Sub-page for one topic of a public section. Content is a labelled placeholder. */
export function TopicPage({ section, topic }: TopicPageProps) {
  const siblings = section.topics.filter((t) => slugify(t.title) !== slugify(topic.title));
  return (
    <>
      <PageHero
        title={topic.title}
        eyebrow={section.title}
        intro={topic.description}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: section.title, href: `/${section.slug}` },
          { label: topic.title },
        ]}
      />
      <Container className="py-12 md:py-16">
        <p
          role="note"
          className="max-w-2xl rounded-md border border-gold-500 bg-gold-50 p-4 text-sm text-navy-900"
        >
          Placeholder: the content for this page is being prepared.
        </p>
        {siblings.length > 0 && (
          <nav aria-label={`More in ${section.title}`} className="mt-10">
            <h2 className="font-serif text-2xl font-bold text-navy-900">More in {section.title}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling) => (
                <li key={sibling.title}>
                  <Link
                    href={topicHref(section, sibling)}
                    className="block rounded-lg border border-navy-100 bg-white px-4 py-3 font-semibold text-navy-900 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  >
                    {sibling.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Container>
    </>
  );
}
