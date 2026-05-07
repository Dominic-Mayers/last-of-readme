#!/usr/bin/env node

const {
  collectPackageFilePathInput,
  preparePackageFilePathInput,
} = require('./step-logic-user-input.cjs');
const {
  collectPackageFilePathDefaultsEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
} = require('./step-logic-filesystem.cjs');

async function checkPackageFilePath(pipelineState = {}) {

  pipelineState = collectPackageFilePathDefaultsEnvironmentInput(pipelineState);
  pipelineState = await collectPackageFilePathInput(pipelineState);
  pipelineState = preparePackageFilePathInput(pipelineState);
  pipelineState = collectPackageFilePathEnvironmentInput(pipelineState);
  pipelineState = preparePackageFilePathEnvironmentInput(pipelineState);
  pipelineState = checkPackageFilePathRequirements(pipelineState);

  return finalizePackageFilePathState(pipelineState);
}

module.exports = {
  checkPackageFilePath,
};
