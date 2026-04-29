#!/usr/bin/env node

const {
  collectCwdPackageRootEnvironmentInput,
  prepareCwdPackageRootEnvironmentInput,
  checkCwdPackageRootRequirements,
  finalizeCwdPackageRootState,
} = require('./cwd-package-root-interaction.cjs');

function runCwdPackageRootCycle(config = {}) {
  const configWithCollectedEnvironmentInput =
    collectCwdPackageRootEnvironmentInput(config);
  const configWithCleanedEnvironmentInput =
    prepareCwdPackageRootEnvironmentInput(configWithCollectedEnvironmentInput);
  const configWithCheckedRequirements =
    checkCwdPackageRootRequirements(configWithCleanedEnvironmentInput);

  return finalizeCwdPackageRootState(configWithCheckedRequirements);
}

module.exports = {
  runCwdPackageRootCycle,
};
