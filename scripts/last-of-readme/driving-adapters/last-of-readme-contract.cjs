#!/usr/bin/env node

require('../core/command-result.js');
require('../core/last-of-readme-contract.js');

const {
  SUPPORTED_CONTRACTS,
  printContractResult,
  runContractCommand,
} = globalThis.LastOfReadmeContract;

const { createDefaultRuntimePorts } = require('../driven-adapters/default-runtime-ports.cjs');

async function main() {
  const ports = createDefaultRuntimePorts();
  const result = await runContractCommand({
    args: process.argv.slice(2),
    ports,
  });

  printContractResult(result, ports);

  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SUPPORTED_CONTRACTS,
  printContractResult,
  runContractCommand,
};
