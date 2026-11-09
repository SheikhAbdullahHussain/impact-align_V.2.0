import Link from 'next/link';
import { Container, EmptyState } from '@impactalign/ui';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { PageHero } from '@/components/marketing/page-hero';
import { fetchSdgs } from '@/lib/sdgs/api';
import { getSection } from '@/lib/section-content';
import { sectionMetadata } from '@/lib/section-metadata';
import { topicHref } from '@/lib/topics';

export const metadata = sectionMetadata('sdgs');

export default async function Page() {
  const section = getSection('sdgs');
  const sdgs = await fetchSdgs();

  return (
    <>
      <PageHero
        title="SDG Explorer"
        eyebrow={section.eyebrow}
        intro="Select a goal to see its targets and indicators."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'SDGs' }]}
      />
      <Container className="py-12 md:py-16">
        {sdgs === null && (
          <EmptyState
            title="The SDG catalogue is temporarily unavailable"
            description="Please try again in a few minutes."
          />
        )}
        {sdgs !== null && sdgs.length === 0 && (
          <EmptyState
            title="No goals loaded yet"
            description="The SDG catalogue has not been seeded in this environment."
          />
        )}
        {sdgs && sdgs.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {sdgs.map((sdg) => (
              <li key={sdg.id}>
                <Link
                  href={`/sdgs/${sdg.number}`}
                  className="flex h-full min-h-32 flex-col justify-between rounded-xl border border-navy-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                    SDG
                  </span>
                  <span className="font-serif text-4xl font-bold text-navy-900">{sdg.number}</span>
                  <span className="mt-2 text-sm text-navy-800">
                    {sdg.title ?? 'Official title pending import'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-14 font-serif text-2xl font-bold text-navy-900">More about the SDGs</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {section.topics.map((topic) => (
            <li key={topic.title}>
              <Link
                href={topicHref(section, topic)}
                className="block rounded-lg border border-navy-100 bg-white px-4 py-3 font-semibold text-navy-900 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                {topic.title}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
      <CtaBanner />
    </>
  );
}