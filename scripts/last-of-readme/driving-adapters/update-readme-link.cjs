#!/usr/bin/env node

require('../core/command-result.js');
require('../core/update-readme-link.js');

const {
  CENTRAL_RESOLVER_URL,
  END_MARKER,
  EXAMPLE_END_MARKER,
  EXAMPLE_START_MARKER,
  START_MARKER,
  buildResolverLink,
  encodeBadgeField,
  findManagedPlaceholder,
  printUpdateReadmeLinkResult,
  replaceManagedBlock,
  resolveInputs,
  runUpdateReadmeLink,
} = globalThis.LastOfReadmeUpdateReadmeLink;

const { createDefaultRuntimePorts } = require('../ports/default-runtime-ports.cjs');

function main() {
  const ports = createDefaultRuntimePorts();
  const result = runUpdateReadmeLink({
    args: process.argv.slice(2),
    ports,
  });

  printUpdateReadmeLinkResult(result, ports);

  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  CENTRAL_RESOLVER_URL,
  END_MARKER,
  EXAMPLE_END_MARKER,
  EXAMPLE_START_MARKER,
  START_MARKER,
  buildResolverLink,
  encodeBadgeField,
  findManagedPlaceholder,
  printUpdateReadmeLinkResult,
  replaceManagedBlock,
  resolveInputs,
  runUpdateReadmeLink,
};
