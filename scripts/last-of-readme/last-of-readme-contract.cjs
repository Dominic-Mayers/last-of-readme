#!/usr/bin/env node

const readline = require('readline');
const {
  packageFilePath,
  updatePackageJsonFields,
} = require('./adapters/npm-adapter.cjs');

const SUPPORTED_CONTRACTS = {
  'successor-of': describeSuccessorOf,
  'last-of': describeLastOf,
};

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function usage() {
  console.error('Usage: node scripts/last-of-readme/last-of-readme-contract.cjs <contract>');
  console.error('Supported contracts: successor-of, last-of');
  process.exit(1);
}

function describeSuccessorOf(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using this order:`,
    '',
    '1. vX.Y.Z-last-doc',
    '2. vX.Y.Z-next-doc',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. A page listing multiple branches containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeLastOf(documentationPath) {
  return [
    `The documentation link will redirect directly to ${documentationPath} only when vX.Y.Z-last-doc exists.`,
    '',
    'If vX.Y.Z-last-doc does not exist, the resolver will show an intermediary page saying that no authoritative documentation was found.',
    '',
    'The intermediary page will propose fallback documentation using this order:',
    '',
    '1. vX.Y.Z-next-doc',
    '2. HEAD of a unique branch containing vX.Y.Z',
    '3. A page listing multiple branches containing vX.Y.Z',
    '4. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function askConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(/^y(?:es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const contract = process.argv[2];

  if (!contract) {
    usage();
  }

  const describe = SUPPORTED_CONTRACTS[contract];
  if (!describe) {
    fail(`Unsupported Last of Readme contract: ${contract}`);
  }

  try {
    const documentationPath = packageFilePath();
    const confirmed = await askConfirmation(describe(documentationPath));

    if (!confirmed) {
      console.log('No changes made.');
      return;
    }

    updatePackageJsonFields({
      'lastOfReadme.contract': contract,
    });

    console.log(`✅ Last of Readme contract set to ${contract}`);
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
