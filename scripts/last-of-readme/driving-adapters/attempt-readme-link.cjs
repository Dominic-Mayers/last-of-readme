#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');
const { createDefaultRuntimePorts } = require('../ports/default-runtime-ports.cjs');
const { runUpdateReadmeLink, printUpdateReadmeLinkResult } = require('./update-readme-link.cjs');

runAttempt('update README resolver link', async () => {
  const ports = createDefaultRuntimePorts();
  const args = process.argv.slice(2);

  const result = runUpdateReadmeLink({ args, ports });
  printUpdateReadmeLinkResult(result, ports);

  if (!result.ok) {
    throw new Error(result.message || 'update failed');
  }
});
