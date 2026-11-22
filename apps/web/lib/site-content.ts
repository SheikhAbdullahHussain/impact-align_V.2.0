import type { ContentEntryDto } from '@impactalign/types';

const apiUrl = () => (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/**
 * Published website content from the API, or null when there is none or the API is down.
 * Callers fall back to the built-in text, so the site never goes blank. Cached for 60 seconds.
 */
export async function getPublishedContent<T>(
  kind: 'faq' | 'section' | 'legal' | 'plans',
  key: string,
): Promise<T | null> {
  try {
    const response = await fetch(`${apiUrl()}/api/v1/content/${kind}/${encodeURIComponent(key)}`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { entry?: ContentEntryDto };
    return (body.entry?.data as T | undefined) ?? null;
  } catch {
    return null;
  }
}
