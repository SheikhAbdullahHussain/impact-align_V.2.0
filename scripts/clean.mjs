#!/usr/bin/env node
import { rmSync } from 'node:fs';
import { globSync } from 'node:fs';

for (const dir of globSync([
  '{apps,packages}/*/dist',
  '{apps,packages}/*/.next',
  '{apps,packages}/*/coverage',
])) {
  rmSync(dir, { recursive: true, force: true });
  console.log(`removed ${dir}`);
}
