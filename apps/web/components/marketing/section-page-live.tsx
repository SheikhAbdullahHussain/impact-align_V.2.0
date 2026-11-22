import type { SectionContentDto } from '@impactalign/types';
import { getSection, type SectionContent } from '@/lib/section-content';
import { getPublishedContent } from '@/lib/site-content';
import { SectionPage } from './section-page';

/** Published section text from the admin panel; the built-in text until then. */
export async function LiveSectionPage({ slug }: { readonly slug: string }) {
  const base = getSection(slug);
  const published = await getPublishedContent<SectionContentDto>('section', slug);
  if (!published) return <SectionPage slug={slug} />;
  const content: SectionContent = {
    slug: base.slug,
    title: published.title,
    eyebrow: published.eyebrow,
    intro: published.intro,
    published: true,
    topics: published.topics.map((topic) => ({
      title: topic.title,
      description: topic.description,
      ...(topic.body.length > 0 ? { body: topic.body } : {}),
    })),
  };
  return <SectionPage slug={slug} content={content} />;
}
