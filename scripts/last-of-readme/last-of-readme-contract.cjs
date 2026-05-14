#!/usr/bin/env node

const readline = require('readline');
const {
  packageFilePath,
  updatePackageJsonFields,
} = require('./adapters/npm-adapter.cjs');

const SUPPORTED_CONTRACTS = {
  'until-successor-of': describeUntilSuccessorOf,
  'until-last-of': describeUntilLastOf,
  'last-of': describeLastOf,
  'continuation-of': describeContinuationOf,
  'correction-of': describeCorrectionOf,
};

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function usage() {
  console.error('Usage: last-of-readme contract <contract>');
  console.error('Supported contracts: until-successor-of, until-last-of, last-of, continuation-of, correction-of');
  process.exit(1);
}

function describeUntilSuccessorOf(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using this order:`,
    '',
    '1. vX.Y.Z-last-of',
    '2. vX.Y.Z-successor-of',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. A page listing multiple branches containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeUntilLastOf(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using the same order as until-successor-of, but with a warning when vX.Y.Z-last-of is absent.`,
    '',
    'Resolution order:',
    '',
    '1. vX.Y.Z-last-of',
    '2. vX.Y.Z-successor-of',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. A page listing multiple branches containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeLastOf(documentationPath) {
  return [
    `The documentation link will redirect directly to ${documentationPath} only when vX.Y.Z-last-of exists.`,
    '',
    'If vX.Y.Z-last-of does not exist, the resolver will show an intermediary page saying that no authoritative documentation was found.',
    '',
    'The intermediary page will propose fallback documentation using this order:',
    '',
    '1. A page listing multiple branches containing vX.Y.Z',
    '2. vX.Y.Z-successor-of',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}


function describeContinuationOf(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using the same order as last-of, but without warning when vX.Y.Z-last-of is absent.`,
    '',
    'Resolution order:',
    '',
    '1. vX.Y.Z-last-of',
    '2. A page listing multiple branches containing vX.Y.Z',
    '3. vX.Y.Z-successor-of',
    '4. HEAD of a unique branch containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeCorrectionOf(documentationPath) {
  return [
    `The documentation link will redirect to ${documentationPath} at vX.Y.Z-correction-of when that tag exists.`,
    '',
    'If vX.Y.Z-correction-of does not exist, the resolver will redirect to vX.Y.Z.',
    '',
    'The correction-of tag is a movable documentation pointer. Running the tag script for correction-of again replaces the correction pointer for the current version.',
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
      'lastOfReadme.nextContract': contract,
    });

    console.log(`✅ Last of Readme next contract set to ${contract}`);
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
