/**
 * Where to go after signing in. Only same-site paths are allowed, so a crafted ?next=https://evil.example
 * link cannot turn the login page into an open redirect.
 */
export function safeNextPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return fallback;
  for (const char of value) {
    if (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) return fallback; // control characters
  }
  return value;
}
