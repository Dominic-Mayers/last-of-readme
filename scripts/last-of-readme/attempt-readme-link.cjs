#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');
const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');
const { runUpdateReadmeLink, printUpdateReadmeLinkResult } = require('./update-readme-link.cjs');

runAttempt('update README resolver link', async () => {
  const ports = createDefaultRuntimePorts();
  const result = runUpdateReadmeLink({ args: process.argv.slice(2), ports });
  printUpdateReadmeLinkResult(result, ports);
  if (!result.ok) {
    throw new Error(result.message || 'update failed');
  }
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
