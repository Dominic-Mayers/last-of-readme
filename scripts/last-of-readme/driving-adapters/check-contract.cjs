#!/usr/bin/env node

require('../core/command-result.js');
require('../core/check-contract.js');

const {
  SUPPORTED_CONTRACTS,
  formatMissingContractBeforeVersion,
  formatUnsupportedContractBeforeVersion,
  runCheckContract,
} = globalThis.LastOfReadmeCheckContract;

const { createDefaultRuntimePorts } = require('../driven-adapters/default-runtime-ports.cjs');

function main() {
  const ports = createDefaultRuntimePorts();
  const result = runCheckContract({ ports });

  if (!result.ok) {
    ports.userInput.printAbortMessage(result.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SUPPORTED_CONTRACTS,
  formatMissingContractBeforeVersion,
  formatUnsupportedContractBeforeVersion,
  runCheckContract,
};
