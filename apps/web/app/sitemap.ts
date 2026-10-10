import type { MetadataRoute } from 'next';
import { joinNav, legalPages, publicNav } from '@impactalign/config';
import { siteUrl } from '@/lib/site-url';
import { allTopicPaths } from '@/lib/topics';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...publicNav.map((i) => i.href),
    joinNav.href,
    ...legalPages.map((p) => `/${p.slug}`),
    ...allTopicPaths,
  ];
  return paths.map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
