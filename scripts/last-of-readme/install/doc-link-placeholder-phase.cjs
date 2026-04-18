#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
} = require('./user-interaction.cjs');
const {
  collectDocLinkPlaceholderEnvironmentInput,
  prepareDocLinkPlaceholderEnvironmentInput,
  checkDocLinkPlaceholderRequirements,
  finalizeDocLinkPlaceholderState,
} = require('./package-file-interaction.cjs');

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
