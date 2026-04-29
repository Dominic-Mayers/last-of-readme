#!/usr/bin/env node

const {
  collectPackageFilePathInput,
  preparePackageFilePathInput,
} = require('./user-input-step-logic.cjs');
const {
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
} = require('./filesystem-step-logic.cjs');

async function checkPackageFilePath(config = {}) {
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
  checkPackageFilePath,
};
