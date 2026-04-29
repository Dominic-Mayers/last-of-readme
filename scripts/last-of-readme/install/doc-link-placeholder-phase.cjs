#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
} = require('./user-input-step-logic.cjs');
const {
  collectDocLinkPlaceholderEnvironmentInput,
  prepareDocLinkPlaceholderEnvironmentInput,
  checkDocLinkPlaceholderRequirements,
  finalizeDocLinkPlaceholderState,
} = require('./filesystem-step-logic.cjs');

async function runDocLinkPlaceholderCycle(config = {}) {
  const configWithCollectedUserInput =
    await collectDocLinkPlaceholderInput(config);
  const configWithCleanedUserInput =
    prepareDocLinkPlaceholderInput(configWithCollectedUserInput);
  const configWithCollectedEnvironmentInput =
    collectDocLinkPlaceholderEnvironmentInput(configWithCleanedUserInput);
  const configWithCleanedEnvironmentInput =
    prepareDocLinkPlaceholderEnvironmentInput(
      configWithCollectedEnvironmentInput
    );
  const configWithCheckedRequirements =
    checkDocLinkPlaceholderRequirements(configWithCleanedEnvironmentInput);

  return finalizeDocLinkPlaceholderState(configWithCheckedRequirements);
}

module.exports = {
  runDocLinkPlaceholderCycle,
};
