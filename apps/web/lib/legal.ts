import type { Metadata } from 'next';
import { legalPages } from '@impactalign/config';

export function getLegalPage(slug: string) {
  const page = legalPages.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown legal page: ${slug}`);
  return page;
}

export function legalMetadata(slug: string): Metadata {
  const { title } = getLegalPage(slug);
  return { title, alternates: { canonical: `/${slug}` } };
}
