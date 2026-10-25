import { Redis } from 'ioredis';
import type { AppLogger } from '../common/logger';

/**
 * Shared Redis client. It reconnects automatically and never crashes the process when
 * Redis is down; commands fail fast (no offline queue) so health checks report accurately.
 * Connection errors are logged once per outage (not on every retry) to keep logs readable.
 */
export function createRedisClient(url: string, logger: AppLogger): Redis {
  const client = new Redis(url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    retryStrategy: (attempt) => Math.min(attempt * 200, 5_000),
  });

  let failing = false;
  client.on('error', (err: NodeJS.ErrnoException) => {
    if (failing) return;
    failing = true;
    logger.warn(
      { code: err.code, message: err.message || 'connection failed' },
      'Redis unavailable (retrying in the background; further errors are not logged until it recovers)',
    );
  });
  client.on('ready', () => {
    failing = false;
    logger.info('Redis connection ready');
  });
  return client;
}

export async function pingRedis(client: Redis): Promise<void> {
  if (client.status !== 'ready') throw new Error(`Redis not ready (status: ${client.status})`);
  const reply = await client.ping();
  if (reply !== 'PONG') throw new Error('Unexpected Redis PING reply');
}
