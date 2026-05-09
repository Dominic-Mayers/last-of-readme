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
  checkGitRemoteRequirements,
  finalizeRemoteState,
} = require('./step-logic-git.cjs');

async function checkGitRemote(pipelineState = {}) {

  pipelineState = collectCurrentRemoteConfigurationEnvironmentInput(pipelineState);
  pipelineState = prepareRemoteDefaultsInput(pipelineState);
  pipelineState = await collectRemoteUrlsInput(pipelineState);
  pipelineState = prepareRemoteUrlsInput(pipelineState);
  pipelineState = checkGitRemoteRequirements(pipelineState);

  return finalizeRemoteState(pipelineState);
}

module.exports = {
  checkGitRemote,
};
