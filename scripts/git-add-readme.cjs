#!/usr/bin/env node

const { spawnSync } = require('child_process');
const { packageFilePath } = require('./last-of-readme/adapters/npm-adapter.cjs');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  const pckFilePath = packageFilePath();

  const result = spawnSync('git', ['add', pckFilePath], {
    stdio: 'inherit',
  });

  if (result.error) {
    fail(`git add failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`git add failed with exit code ${result.status}`);
  }
}

main();
