#!/usr/bin/env node

const {
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
} = require('./step-logic-filesystem.cjs');

async function checkPackageFilePath(pipelineState = {}) {

  pipelineState = collectPackageFilePathEnvironmentInput(pipelineState);
  pipelineState = preparePackageFilePathEnvironmentInput(pipelineState);
  pipelineState = checkPackageFilePathRequirements(pipelineState);

  return finalizePackageFilePathState(pipelineState);
}

module.exports = {
  checkPackageFilePath,
};
