#!/usr/bin/env node

const {
  collectConfiguredRemoteNameEnvironmentInput,
  collectCurrentRemoteConfigurationEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  collectRemoteInput,
  collectRemoteUrlsInput,
  prepareRemoteInput,
  prepareRemoteDefaultsInput,
  prepareRemoteUrlsInput,
} = require('./step-logic-user-input.cjs');
const {
  collectGitRemotesEnvironmentInput,
  checkGitRemoteRequirements,
  finalizeRemoteState,
} = require('./step-logic-git.cjs');

async function checkGitRemote(pipelineState = {}) {

  pipelineState = collectGitRemotesEnvironmentInput(pipelineState);
  pipelineState = collectConfiguredRemoteNameEnvironmentInput(pipelineState);
  pipelineState = collectCurrentRemoteConfigurationEnvironmentInput(pipelineState);
  pipelineState = await collectRemoteInput(pipelineState);
  pipelineState = prepareRemoteInput(pipelineState);
  pipelineState = prepareRemoteDefaultsInput(pipelineState);
  pipelineState = await collectRemoteUrlsInput(pipelineState);
  pipelineState = prepareRemoteUrlsInput(pipelineState);
  pipelineState = checkGitRemoteRequirements(pipelineState);

  return finalizeRemoteState(pipelineState);
}

module.exports = {
  checkGitRemote,
};
