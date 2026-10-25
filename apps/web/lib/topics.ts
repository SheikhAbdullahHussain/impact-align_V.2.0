import type { TitledItem } from './home-content';
import { sections, type SectionContent } from './section-content';

/** URL slug for a topic title: "Vision & Mission" -> "vision-and-mission". */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const topicHref = (section: SectionContent, topic: TitledItem): string =>
  `/${section.slug}/${slugify(topic.title)}`;

export function findTopic(
  sectionSlug: string,
  topicSlug: string,
): { section: SectionContent; topic: TitledItem } | null {
  const section = sections.find((s) => s.slug === sectionSlug);
  const topic = section?.topics.find((t) => slugify(t.title) === topicSlug);
  return section && topic ? { section, topic } : null;
}

/** Every public topic route (used by the sitemap). */
export const allTopicPaths: readonly string[] = sections.flatMap((section) =>
  section.topics.map((topic) => topicHref(section, topic)),
);
