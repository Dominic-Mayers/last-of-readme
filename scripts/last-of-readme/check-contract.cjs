#!/usr/bin/env node

const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');

const SUPPORTED_CONTRACTS = new Set(['until-next', 'until-next-warn', 'until-branch', 'until-branch-warn', 'correction-of']);

function formatUnsupportedContractBeforeVersion(contract) {
  return (
    `Unsupported Last of Readme contract: "${contract}".\n\n` +
    `From the package root, run one of:\n` +
    `  npx last-of-readme contract until-next\n` +
    `  npx last-of-readme contract until-next-warn\n` +
    `  npx last-of-readme contract until-branch\n` +
    `  npx last-of-readme contract until-branch-warn\n` +
    `  npx last-of-readme contract correction-of\n\n` +
    `Then retry:\n` +
    `  npm version patch\n`
  );
}

function formatMissingContractBeforeVersion(error) {
  return (
    (error && error.message ? error.message : String(error)) +
    '\n\nBefore bumping the version, choose the resolver contract for the next README link.\n\n' +
    'From the package root, run:\n' +
    '  npx last-of-readme contract until-next\n\n' +
    'Then retry:\n' +
    '  npm version patch\n'
  );
}

function runCheckContract({ ports }) {
  try {
    const contract = ports.npm.configuredNextDocumentationContract();

    if (!SUPPORTED_CONTRACTS.has(contract)) {
      return {
        ok: false,
        message: formatUnsupportedContractBeforeVersion(contract),
      };
    }

    return {
      ok: true,
      contract,
    };
  } catch (err) {
    return {
      ok: false,
      message: formatMissingContractBeforeVersion(err),
    };
  }
}

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
