import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface GeneratedToken {
  /** Give this to the user (cookie or email link). Never store it. */
  token: string;
  /** Store this. A database leak then does not reveal usable tokens. */
  hash: string;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 256 bits of randomness, URL-safe. */
export function generateToken(bytes = 32): GeneratedToken {
  const token = randomBytes(bytes).toString('base64url');
  return { token, hash: hashToken(token) };
}

/** Constant-time string comparison (safe for secrets of different lengths). */
export function safeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}
