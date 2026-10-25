import { parseWebEnv } from '@impactalign/config';

/** Validated public site URL (used for canonical URLs, sitemap and robots). */
export const siteUrl = parseWebEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}).NEXT_PUBLIC_SITE_URL;
