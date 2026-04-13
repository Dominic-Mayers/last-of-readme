#!/usr/bin/env node

const { spawnSync } = require('child_process');
const workspace = require('./adapters/local-workspace-adapter.cjs');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  const packageFilePath = workspace.packageFilePath();

  const result = spawnSync('git', ['add', packageFilePath], {
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
