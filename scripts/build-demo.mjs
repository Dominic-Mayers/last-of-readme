#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Placeholder build step for the first vertical slice.
//
// The checked-in docs/demo.bundle.js is currently the runnable artifact. This
// script exists so the repository already has the public command that later can
// be replaced by esbuild/rollup/vite without changing the workflow.

const bundle = resolve('docs/demo.bundle.js');
if (!existsSync(bundle)) {
  console.error('docs/demo.bundle.js not found. The bundle is checked in and must be present.');
  process.exit(1);
}
console.log('demo bundle is present at docs/demo.bundle.js');
