import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
  /** True when the stored hash was made with weaker parameters than the current ones. */
  needsRehash(stored: string): boolean;
}

export interface ScryptOptions {
  /** log2 of the CPU/memory cost N. 17 (=128 MiB) follows the OWASP minimum; tests may lower it. */
  readonly log2N?: number;
  readonly r?: number;
  readonly p?: number;
}

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const FORMAT = 'scrypt';

/** scrypt (memory-hard) via Node's built-in crypto: no native dependency to build or deploy. */
export function createScryptHasher(options: ScryptOptions = {}): PasswordHasher {
  const log2N = options.log2N ?? 17;
  const r = options.r ?? 8;
  const p = options.p ?? 1;
  const maxmem = 128 * 2 ** log2N * r * 2 + 1024 * 1024;

  const derive = (plain: string, salt: Buffer, n: number, rr: number, pp: number) =>
    scrypt(plain.normalize('NFKC'), salt, KEY_LENGTH, {
      N: n,
      r: rr,
      p: pp,
      maxmem: Math.max(maxmem, 128 * n * rr * 2 + 1024 * 1024),
    });

  return {
    async hash(plain) {
      const salt = randomBytes(SALT_LENGTH);
      const key = await derive(plain, salt, 2 ** log2N, r, p);
      return [FORMAT, log2N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$');
    },

    async verify(plain, stored) {
      const parts = stored.split('$');
      if (parts.length !== 6 || parts[0] !== FORMAT) return false;
      const [, nLog, rStr, pStr, saltB64, keyB64] = parts as [
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      const n = 2 ** Number(nLog);
      const rr = Number(rStr);
      const pp = Number(pStr);
      if (![n, rr, pp].every((v) => Number.isInteger(v) && v > 0) || Number(nLog) > 20)
        return false;
      const expected = Buffer.from(keyB64, 'base64url');
      const actual = await derive(plain, Buffer.from(saltB64, 'base64url'), n, rr, pp);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    },

    needsRehash(stored) {
      const parts = stored.split('$');
      if (parts.length !== 6 || parts[0] !== FORMAT) return true;
      return Number(parts[1]) < log2N || Number(parts[2]) < r || Number(parts[3]) < p;
    },
  };
}
