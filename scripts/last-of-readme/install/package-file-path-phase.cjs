#!/usr/bin/env node

const {
  collectPackageFilePathInput,
  preparePackageFilePathInput,
} = require('./user-interaction.cjs');
const {
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
} = require('./package-file-interaction.cjs');

async function runPackageFilePathCycle(config = {}) {
  const configWithCollectedUserInput = await collectPackageFilePathInput(config);
  const configWithCleanedUserInput =
    preparePackageFilePathInput(configWithCollectedUserInput);
  const configWithCollectedEnvironmentInput =
    collectPackageFilePathEnvironmentInput(configWithCleanedUserInput);
  const configWithCleanedEnvironmentInput =
    preparePackageFilePathEnvironmentInput(configWithCollectedEnvironmentInput);
  const configWithCheckedRequirements =
    checkPackageFilePathRequirements(configWithCleanedEnvironmentInput);

  return finalizePackageFilePathState(configWithCheckedRequirements);
}

module.exports = {
  runPackageFilePathCycle,
};
