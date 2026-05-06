#!/usr/bin/env node

const {
  collectNpmPackageRootEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  prepareCwdPackageRootEnvironmentInput,
  checkCwdIsPackageRootRequirements,
  finalizeCwdPackageRootState,
} = require('./step-logic-filesystem.cjs');

function checkCwdIsPackageRoot(pipelineState = {}) {

  pipelineState = collectNpmPackageRootEnvironmentInput(pipelineState);
  pipelineState = prepareCwdPackageRootEnvironmentInput(pipelineState);
  pipelineState = checkCwdIsPackageRootRequirements(pipelineState);

  return finalizeCwdPackageRootState(pipelineState);
}

module.exports = {
  checkCwdIsPackageRoot,
};
