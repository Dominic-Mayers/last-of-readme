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

async function checkGitRemote(config = {}) {

  config = collectGitRemotesEnvironmentInput(config);
  config = collectConfiguredRemoteNameEnvironmentInput(config);
  config = await collectRemoteInput(config);
  config = prepareRemoteInput(config);
  config = collectRemoteEnvironmentInput(config);
  config = prepareRemoteEnvironmentInput(config);
  config = checkGitRemoteRequirements(config);

  return finalizeRemoteState(config);
}

module.exports = {
  checkGitRemote,
};
