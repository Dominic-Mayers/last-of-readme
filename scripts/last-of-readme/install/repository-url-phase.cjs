#!/usr/bin/env node

const {
  collectRemoteInput,
  prepareRemoteInput,
} = require('./user-input-step-logic.cjs');
const {
  collectRemoteEnvironmentInput,
  prepareRemoteEnvironmentInput,
  checkRemoteRequirements,
  finalizeRemoteState,
} = require('./git-step-logic.cjs');

async function runRemoteCycle(config = {}) {
  const configWithCollectedUserInput = await collectRemoteInput(config);
  const configWithCleanedUserInput =
    prepareRemoteInput(configWithCollectedUserInput);
  const configWithCollectedEnvironmentInput =
    collectRemoteEnvironmentInput(configWithCleanedUserInput);
  const configWithCleanedEnvironmentInput =
    prepareRemoteEnvironmentInput(configWithCollectedEnvironmentInput);
  const configWithCheckedRequirements =
    checkRemoteRequirements(configWithCleanedEnvironmentInput);

  return finalizeRemoteState(configWithCheckedRequirements);
}

module.exports = {
  runRemoteCycle,
};
