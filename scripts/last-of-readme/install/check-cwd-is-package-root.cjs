#!/usr/bin/env node

const {
  collectNpmPackageRootEnvironmentInput,
} = require('./npm-step-logic.cjs');
const {
  collectCwdEnvironmentInput,
  prepareCwdPackageRootEnvironmentInput,
  checkCwdPackageRootRequirements,
  finalizeCwdPackageRootState,
} = require('./filesystem-step-logic.cjs');

function checkCwdIsPackageRoot(config = {}) {
  const configWithCollectedNpmInput =
    collectNpmPackageRootEnvironmentInput(config);
  const configWithCollectedFilesystemInput =
    collectCwdEnvironmentInput(configWithCollectedNpmInput);
  const configWithCleanedEnvironmentInput =
    prepareCwdPackageRootEnvironmentInput(configWithCollectedFilesystemInput);
  const configWithCheckedRequirements =
    checkCwdPackageRootRequirements(configWithCleanedEnvironmentInput);

  return finalizeCwdPackageRootState(configWithCheckedRequirements);
}

module.exports = {
  checkCwdIsPackageRoot,
};
