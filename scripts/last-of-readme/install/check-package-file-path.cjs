#!/usr/bin/env node

const {
  collectPackageFilePathInput,
  preparePackageFilePathInput,
} = require('./step-logic-user-input.cjs');
const {
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
} = require('./step-logic-filesystem.cjs');

async function checkPackageFilePath(config = {}) {

  config = await collectPackageFilePathInput(config);
  config = preparePackageFilePathInput(config);
  config = collectPackageFilePathEnvironmentInput(config);
  config = preparePackageFilePathEnvironmentInput(config);
  config = checkPackageFilePathRequirements(config);

  return finalizePackageFilePathState(config);
}

module.exports = {
  checkPackageFilePath,
};
