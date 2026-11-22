import { connectMongo, disconnectMongo } from '@impactalign/database';
import { loadEnv } from '../config/env';
import { createMongoRepositories } from '../data/mongo-repositories';

async function run(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Pass the account email as the first argument.');
  const env = loadEnv();
  if (env.NODE_ENV === 'production') throw new Error('This script is for development only.');

  await connectMongo({ uri: env.MONGODB_URI });
  try {
    const repos = createMongoRepositories();
    const user = await repos.users.findByEmail(email);
    if (!user) throw new Error('No account with this email.');
    await repos.users.setEmailVerified(user.id, new Date());
    process.stdout.write(`Verified: ${email}\n`);
  } finally {
    await disconnectMongo();
  }
}

run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
