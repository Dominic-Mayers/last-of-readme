#!/usr/bin/env node

const { configuredNextDocumentationContract } = require('./adapters/npm-adapter.cjs');
const {
  printAbortMessage,
} = require('./adapters/prompt-user-input.cjs');

const SUPPORTED_CONTRACTS = new Set(['until-next', 'until-next-warn', 'until-branch', 'until-branch-warn', 'correction-of']);

function fail(message) {
  printAbortMessage(message);
  process.exit(1);
}

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

function main() {
  try {
    const contract = configuredNextDocumentationContract();

    if (!SUPPORTED_CONTRACTS.has(contract)) {
      fail(formatUnsupportedContractBeforeVersion(contract));
    }
  } catch (err) {
    fail(formatMissingContractBeforeVersion(err));
  }
}

main();
