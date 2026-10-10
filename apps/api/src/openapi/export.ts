import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openApiDocument } from './openapi';

const target = path.resolve(__dirname, '../../../../docs/api/openapi.json');
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(openApiDocument, null, 2)}\n`);
console.log(`OpenAPI document written to ${target}`);
