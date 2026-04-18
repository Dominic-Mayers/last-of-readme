#!/usr/bin/env node

const {
  collectPackageFilePathInput,
  cleanPackageFilePathInput,
} = require('./user-interaction.cjs');
const {
  collectPackageFilePathEnvironmentInput,
  cleanPackageFilePathEnvironmentInput,
  checkPackageFilePathRequirements,
  normalizePackageFilePathInput,
} = require('./package-file-interaction.cjs');

async function runPackageFilePathCycle(config = {}) {
  const configWithCollectedUserInput = await collectPackageFilePathInput(config);
  const configWithCleanedUserInput =
    cleanPackageFilePathInput(configWithCollectedUserInput);
  const configWithCollectedEnvironmentInput =
    collectPackageFilePathEnvironmentInput(configWithCleanedUserInput);
  const configWithCleanedEnvironmentInput =
    cleanPackageFilePathEnvironmentInput(configWithCollectedEnvironmentInput);
  const configWithCheckedRequirements =
    checkPackageFilePathRequirements(configWithCleanedEnvironmentInput);

  return normalizePackageFilePathInput(configWithCheckedRequirements);
}

module.exports = {
  runPackageFilePathCycle,
};
