/** Built-in website text exported by scripts/export-builtin-content.ts. */
export async function loadBuiltin<T>(name: string): Promise<T> {
  const response = await fetch(`/builtin/${name}.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Built-in text not found');
  return (await response.json()) as T;
}
