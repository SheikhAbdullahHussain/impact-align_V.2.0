import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Where evidence bytes live. Swap the implementation (e.g. S3) without touching the service. */
export interface FileStorage {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

/** Keys are generated server-side (UUIDs); anything else is refused, so paths cannot be forged. */
const KEY_PATTERN = /^[a-f0-9-]{36}$/;

export class LocalFileStorage implements FileStorage {
  constructor(private readonly directory: string) {}

  private pathFor(key: string): string {
    if (!KEY_PATTERN.test(key)) throw new Error('Invalid storage key');
    return path.join(this.directory, key);
  }

  async save(key: string, data: Buffer): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.pathFor(key), data, { flag: 'wx', mode: 0o600 });
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.pathFor(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}