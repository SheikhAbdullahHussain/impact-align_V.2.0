import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseApiEnv, EnvValidationError } = require('../packages/config/dist/index.js');

if (existsSync('.env')) process.loadEnvFile('.env');
else console.warn('No .env file found; validating the current process environment.');

try {
  const env = parseApiEnv(process.env);
  console.log(`✔ Environment valid (NODE_ENV=${env.NODE_ENV})`);
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
