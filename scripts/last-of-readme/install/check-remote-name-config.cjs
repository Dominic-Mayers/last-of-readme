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
  checkRemoteNameConfigRequirements,
  finalizeRemoteNameState,
} = require('./step-logic-git.cjs');

async function checkRemoteNameConfig(pipelineState = {}) {

  pipelineState = collectGitRemotesEnvironmentInput(pipelineState);
  pipelineState = collectConfiguredRemoteNameEnvironmentInput(pipelineState);
  pipelineState = await collectRemoteInput(pipelineState);
  pipelineState = prepareRemoteInput(pipelineState);
  pipelineState = checkRemoteNameConfigRequirements(pipelineState);

  return finalizeRemoteNameState(pipelineState);
}

module.exports = {
  checkRemoteNameConfig,
};
