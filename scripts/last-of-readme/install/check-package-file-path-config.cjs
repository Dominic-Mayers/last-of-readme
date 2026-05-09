#!/usr/bin/env node

const {
  collectPackageFilePathDefaultsEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  collectPackageFilePathInput,
  preparePackageFilePathInput,
} = require('./step-logic-user-input.cjs');
const {
  checkPackageFilePathConfigRequirements,
  finalizePackageFilePathConfigState,
} = require('./step-logic-filesystem.cjs');

async function checkPackageFilePathConfig(pipelineState = {}) {

  pipelineState = collectPackageFilePathDefaultsEnvironmentInput(pipelineState);
  pipelineState = await collectPackageFilePathInput(pipelineState);
  pipelineState = preparePackageFilePathInput(pipelineState);
  pipelineState = checkPackageFilePathConfigRequirements(pipelineState);

  return finalizePackageFilePathConfigState(pipelineState);
}

module.exports = {
  checkPackageFilePathConfig,
};
