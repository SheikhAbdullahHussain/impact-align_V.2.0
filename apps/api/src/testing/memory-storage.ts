import type { FileStorage } from '../storage/file-storage';

export class MemoryFileStorage implements FileStorage {
  readonly files = new Map<string, Buffer>();
  async save(key: string, data: Buffer): Promise<void> {
    this.files.set(key, data);
  }
  async read(key: string): Promise<Buffer | null> {
    return this.files.get(key) ?? null;
  }
  async remove(key: string): Promise<void> {
    this.files.delete(key);
  }
}