import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { connectMongo, disconnectMongo, importCatalogue } from '@impactalign/database';
import { catalogueImportSchema } from '@impactalign/validation';
import { loadEnv } from '../config/env';

async function run(): Promise<void> {
  const file = process.argv[2];
  if (!file) throw new Error('Pass the path of the catalogue JSON file as the first argument.');

  const parsed = catalogueImportSchema.safeParse(
    JSON.parse(await readFile(path.resolve(file), 'utf8')),
  );
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 10).map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`The file is not valid:\n  ${issues.join('\n  ')}`);
  }

  const env = loadEnv();
  await connectMongo({ uri: env.MONGODB_URI });
  try {
    const result = await importCatalogue(parsed.data);
    process.stdout.write(`Catalogue imported: ${JSON.stringify(result)}\n`);
  } finally {
    await disconnectMongo();
  }
}

run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
