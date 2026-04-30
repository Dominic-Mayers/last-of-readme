#!/usr/bin/env node

const {
  collectRemoteInput,
  prepareRemoteInput,
} = require('./step-logic-user-input.cjs');
const {
  collectRemoteEnvironmentInput,
  prepareRemoteEnvironmentInput,
  checkRemoteRequirements,
  finalizeRemoteState,
} = require('./step-logic-git.cjs');

async function checkGitRemote(config = {}) {

  config = await collectRemoteInput(config);
  config = prepareRemoteInput(config);
  config = collectRemoteEnvironmentInput(config);
  config = prepareRemoteEnvironmentInput(config);
  config = checkRemoteRequirements(config);

  return finalizeRemoteState(config);
}

module.exports = {
  checkGitRemote,
};
