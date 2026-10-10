import { connectMongo } from '@impactalign/database';
import type { AppLogger } from '../common/logger';

/**
 * Connects to MongoDB in the background and keeps retrying until it succeeds, so the API
 * (and its /health endpoints) stays up and reports `down` instead of crash-looping.
 * Returns a function that stops further retries.
 */
export function connectMongoWithRetry(uri: string, logger: AppLogger, retryMs = 5_000): () => void {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  const attempt = async (): Promise<void> => {
    try {
      await connectMongo({ uri });
      logger.info('MongoDB connection ready');
    } catch (err) {
      logger.error({ err }, 'MongoDB connection failed; retrying');
      if (!stopped) {
        timer = setTimeout(() => void attempt(), retryMs);
        timer.unref();
      }
    }
  };
  void attempt();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
