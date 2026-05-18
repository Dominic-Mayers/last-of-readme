#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const coreFiles = [
  'command-result.js',
  'update-readme-link.js',
  'tag-doc.js',
  'last-of-readme-contract.js',
];

const srcDir = resolve(root, 'scripts/last-of-readme/core');
const dstDir = resolve(root, 'docs/core');

mkdirSync(dstDir, { recursive: true });

for (const file of coreFiles) {
  copyFileSync(resolve(srcDir, file), resolve(dstDir, file));
  console.log(`copied core/${file} → docs/core/${file}`);
}

const bundle = resolve(root, 'docs/demo.bundle.js');
if (!existsSync(bundle)) {
  console.error('docs/demo.bundle.js not found. The bundle is checked in and must be present.');
  process.exit(1);
}
console.log('demo bundle present at docs/demo.bundle.js');
