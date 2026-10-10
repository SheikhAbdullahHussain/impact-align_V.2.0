#!/usr/bin/env node
// Runs an npm script across workspaces in dependency order (packages first, then apps).
// Usage: node scripts/run-workspaces.mjs <packages|apps|all> <script>
import { spawnSync } from 'node:child_process';

const PACKAGES = ['config', 'types', 'validation', 'database', 'auth', 'ai', 'ui'].map(
  (n) => `@impactalign/${n}`,
);
const APPS = ['api', 'web', 'admin'].map((n) => `@impactalign/${n}`);
const groups = { packages: PACKAGES, apps: APPS, all: [...PACKAGES, ...APPS] };

const [group, script] = process.argv.slice(2);
const targets = groups[group];
if (!targets || !script) {
  console.error('Usage: run-workspaces.mjs <packages|apps|all> <script>');
  process.exit(2);
}

// On Windows, npm is a .cmd shim and cannot be spawned without a shell.
const isWindows = process.platform === 'win32';

for (const ws of targets) {
  console.log(`\n▶ ${ws}: ${script}`);
  const res = spawnSync('npm', ['run', script, '--workspace', ws, '--if-present'], {
    stdio: 'inherit',
    shell: isWindows,
  });
  if (res.error) console.error(res.error.message);
  if (res.status !== 0) {
    console.error(`✖ ${ws}: ${script} failed`);
    process.exit(res.status ?? 1);
  }
}
