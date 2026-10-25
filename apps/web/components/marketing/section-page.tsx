import { Container } from '@impactalign/ui';
import { getSection } from '@/lib/section-content';
import { topicHref } from '@/lib/topics';
import { ItemGrid } from './item-grid';
import { PageHero } from './page-hero';
import { CtaBanner } from './cta-banner';

/** Public section page: hero + the topics the section will cover. Honest about being a placeholder. */
export function SectionPage({ slug }: { readonly slug: string }) {
  const section = getSection(slug);
  return (
    <>
      <PageHero
        title={section.title}
        eyebrow={section.eyebrow}
        intro={section.intro}
        crumbs={[{ label: 'Home', href: '/' }, { label: section.title }]}
      />
      <Container className="py-14 md:py-16">
        {section.topics.length > 0 && (
          <>
            <h2 className="font-serif text-2xl font-bold text-navy-900">Topics in this section</h2>
            <div className="mt-6">
              <ItemGrid
                items={section.topics.map((topic) => ({
                  ...topic,
                  href: topicHref(section, topic),
                }))}
                tone="muted"
              />
            </div>
          </>
        )}
        <p
          role="note"
          className="mt-10 max-w-2xl rounded-md border border-gold-500 bg-gold-50 p-4 text-sm text-navy-900"
        >
          Note: This section is under development.
        </p>
      </Container>
      {slug !== 'join-impactalign' && <CtaBanner />}
    </>
  );
}
