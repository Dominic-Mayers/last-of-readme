#!/usr/bin/env node

const {
  collectPackageFilePathInput,
} = require('./collect-user-input.cjs');
const {
  checkPackageFilePathRequirements,
} = require('./package-file-requirements.cjs');

async function runPackageFilePathCycle(config = {}) {
  const configWithInput = await collectPackageFilePathInput(config);
  const configWithPackageFileState =
    checkPackageFilePathRequirements(configWithInput);

  return configWithPackageFileState;
}

module.exports = {
  runPackageFilePathCycle,
};
