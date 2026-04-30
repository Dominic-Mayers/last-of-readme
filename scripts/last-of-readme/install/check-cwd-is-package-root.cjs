#!/usr/bin/env node

const {
  collectNpmPackageRootEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  collectCwdEnvironmentInput,
  prepareCwdPackageRootEnvironmentInput,
  checkCwdPackageRootRequirements,
  finalizeCwdPackageRootState,
} = require('./step-logic-filesystem.cjs');

function checkCwdIsPackageRoot(config = {}) {

  config = collectNpmPackageRootEnvironmentInput(config);
  config = collectCwdEnvironmentInput(config);
  config = prepareCwdPackageRootEnvironmentInput(config);
  config = checkCwdPackageRootRequirements(config);

  return finalizeCwdPackageRootState(config);
}

module.exports = {
  checkCwdIsPackageRoot,
};
