import type { Metadata } from 'next';
import { getSection } from './section-content';

export function sectionMetadata(slug: string): Metadata {
  const { title, intro } = getSection(slug);
  return {
    title,
    description: intro,
    alternates: { canonical: `/${slug}` },
    ...(slug === 'login' ? { robots: { index: false, follow: false } } : {}),
  };
}
