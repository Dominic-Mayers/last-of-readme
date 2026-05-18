#!/usr/bin/env node

require('../core/command-result.js');
require('../core/tag-doc.js');

const {
  ALLOWED_KINDS,
  MOVABLE_KINDS,
  annotationFor,
  parseTagDocArgs,
  printTagDocResult,
  runTagDocCommand,
} = globalThis.LastOfReadmeTagDoc;

const { createDefaultRuntimePorts } = require('../ports/default-runtime-ports.cjs');

async function main() {
  const ports = createDefaultRuntimePorts();
  const result = await runTagDocCommand({
    args: process.argv.slice(2),
    ports,
  });

  printTagDocResult(result, ports);

  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED_KINDS,
  MOVABLE_KINDS,
  annotationFor,
  parseTagDocArgs,
  printTagDocResult,
  runTagDocCommand,
};
