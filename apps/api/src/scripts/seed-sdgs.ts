import { connectMongo, disconnectMongo, seedSDGs } from '@impactalign/database';
import { loadEnv } from '../config/env';

async function run(): Promise<void> {
  const env = loadEnv();
  await connectMongo({ uri: env.MONGODB_URI });
  try {
    const created = await seedSDGs();
    process.stdout.write(`SDGs seeded (new records: ${created})\n`);
  } finally {
    await disconnectMongo();
  }
}

run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});