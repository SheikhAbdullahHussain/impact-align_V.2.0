import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseApiEnv, type ApiEnv } from '@impactalign/config';

/**
 * Loads a local .env file for development/test only. In production the platform
 * (container orchestrator / secret manager) must inject real environment variables.
 */
function loadLocalEnvFile(): void {
  if (process.env['NODE_ENV'] === 'production') return;
  for (const candidate of [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ]) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
  }
}

export function loadEnv(source: Record<string, string | undefined> = process.env): ApiEnv {
  if (source === process.env) loadLocalEnvFile();
  return parseApiEnv(source);
}
