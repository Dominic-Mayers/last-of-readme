#!/usr/bin/env node

const {
  collectCurrentRemoteConfigurationEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  collectRemoteUrlsInput,
  prepareRemoteDefaultsInput,
  prepareRemoteUrlsInput,
} = require('./step-logic-user-input.cjs');
const {
  checkRemoteUrlsConfigRequirements,
  finalizeRemoteUrlsState,
} = require('./step-logic-git.cjs');

async function checkRemoteUrlsConfig(pipelineState = {}) {

  pipelineState = collectCurrentRemoteConfigurationEnvironmentInput(pipelineState);
  pipelineState = prepareRemoteDefaultsInput(pipelineState);
  pipelineState = await collectRemoteUrlsInput(pipelineState);
  pipelineState = prepareRemoteUrlsInput(pipelineState);
  pipelineState = checkRemoteUrlsConfigRequirements(pipelineState);

  return finalizeRemoteUrlsState(pipelineState);
}

module.exports = {
  checkRemoteUrlsConfig,
};
