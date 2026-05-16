#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');
const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');
const { runTagDocCommand, printTagDocResult } = require('./tag-doc.cjs');

runAttempt('add successor-of tag', async () => {
  const ports = createDefaultRuntimePorts();
  const published = await ports.registry.fetchPublishedLink(ports.npm.packageName());
  if (!published || published.contract === 'correction-of') {
    return;
  }

  const result = await runTagDocCommand({ args: ['successor-of'], ports });
  printTagDocResult(result, ports);
  if (!result.ok) {
    throw new Error(result.message || 'tag-doc failed');
  }
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
