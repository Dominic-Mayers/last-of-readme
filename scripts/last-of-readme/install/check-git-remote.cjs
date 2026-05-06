#!/usr/bin/env node

const {
  collectConfiguredRemoteNameEnvironmentInput,
} = require('./step-logic-npm.cjs');
const {
  collectRemoteInput,
  prepareRemoteInput,
} = require('./step-logic-user-input.cjs');
const {
  collectGitRemotesEnvironmentInput,
  collectRemoteEnvironmentInput,
  prepareRemoteEnvironmentInput,
  checkGitRemoteRequirements,
  finalizeRemoteState,
} = require('./step-logic-git.cjs');

async function checkGitRemote(pipelineState = {}) {

  pipelineState = collectGitRemotesEnvironmentInput(pipelineState);
  pipelineState = collectConfiguredRemoteNameEnvironmentInput(pipelineState);
  pipelineState = await collectRemoteInput(pipelineState);
  pipelineState = prepareRemoteInput(pipelineState);
  pipelineState = collectRemoteEnvironmentInput(pipelineState);
  pipelineState = prepareRemoteEnvironmentInput(pipelineState);
  pipelineState = checkGitRemoteRequirements(pipelineState);

  return finalizeRemoteState(pipelineState);
}

module.exports = {
  checkGitRemote,
};
