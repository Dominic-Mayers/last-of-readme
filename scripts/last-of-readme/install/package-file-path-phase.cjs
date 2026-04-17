#!/usr/bin/env node

const {
  collectPackageFilePathInput,
  cleanPackageFilePathInput,
} = require('./collect-user-input.cjs');
const {
  checkPackageFilePathRequirements,
  normalizePackageFilePathInput,
} = require('./package-file-requirements.cjs');

async function runPackageFilePathCycle(config = {}) {
  const configWithCollectedInput = await collectPackageFilePathInput(config);
  const configWithCleanedInput =
    cleanPackageFilePathInput(configWithCollectedInput);
  const configWithCheckedRequirements =
    checkPackageFilePathRequirements(configWithCleanedInput);

  return normalizePackageFilePathInput(configWithCheckedRequirements);
}

module.exports = {
  runPackageFilePathCycle,
};
