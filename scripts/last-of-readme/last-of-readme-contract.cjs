#!/usr/bin/env node

const {
  packageFilePath,
  updatePackageJsonFields,
} = require('./adapters/npm-adapter.cjs');
const {
  askDocumentationContractConfirmation,
  formatContractUsage,
  formatUnsupportedContract,
  printAbortMessage,
  printNoChangesMade,
  printNextContractSet,
} = require('./adapters/prompt-user-input.cjs');

const SUPPORTED_CONTRACTS = new Set([
  'until-next',
  'until-next-warn',
  'until-branch',
  'until-branch-warn',
  'correction-of',
]);

function fail(message) {
  printAbortMessage(message);
  process.exit(1);
}

function usage() {
  fail(formatContractUsage());
}

async function main() {
  const contract = process.argv[2];

  if (!contract) {
    usage();
  }

  if (!SUPPORTED_CONTRACTS.has(contract)) {
    fail(formatUnsupportedContract(contract));
  }

  try {
    const documentationPath = packageFilePath();
    const confirmed = await askDocumentationContractConfirmation({
      contract,
      documentationPath,
    });

    if (!confirmed) {
      printNoChangesMade();
      return;
    }

    updatePackageJsonFields({ 'lastOfReadme.nextContract': contract });

    printNextContractSet(contract);
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
