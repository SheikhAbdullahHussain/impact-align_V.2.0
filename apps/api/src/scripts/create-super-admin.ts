import { createScryptHasher } from '@impactalign/auth';
import { connectMongo, disconnectMongo } from '@impactalign/database';
import { createSuperAdmin } from '../auth/bootstrap';
import { loadEnv } from '../config/env';
import { createMongoRepositories } from '../data/mongo-repositories';

async function run(): Promise<void> {
  const email = process.env['SUPER_ADMIN_EMAIL'];
  const password = process.env['SUPER_ADMIN_PASSWORD'];
  if (!email || !password) throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD first');

  const env = loadEnv();
  await connectMongo({ uri: env.MONGODB_URI });
  try {
    const user = await createSuperAdmin(createMongoRepositories(), createScryptHasher(), {
      email,
      password,
    });
    process.stdout.write(`SUPER_ADMIN created: ${user.email}\n`);
  } finally {
    await disconnectMongo();
  }
}

run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
