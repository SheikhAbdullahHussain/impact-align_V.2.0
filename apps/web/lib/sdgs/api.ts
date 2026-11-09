import type { SdgDto, SdgIndicatorDto, SdgTargetDto } from '@impactalign/types';

const apiUrl = () => (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** Server-side read of the public SDG catalogue. Returns null when the API is unreachable. */
async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiUrl()}/api/v1/sdgs${path}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    return ((await response.json()) as { data: T }).data;
  } catch {
    return null;
  }
}

export const fetchSdgs = () => get<SdgDto[]>('');
export const fetchSdg = (n: number) => get<SdgDto>(`/${n}`);
export const fetchTargets = (n: number) => get<SdgTargetDto[]>(`/${n}/targets`);
export const fetchIndicators = (n: number) => get<SdgIndicatorDto[]>(`/${n}/indicators`);