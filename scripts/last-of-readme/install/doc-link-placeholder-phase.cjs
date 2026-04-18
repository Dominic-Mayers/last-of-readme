#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
  cleanDocLinkPlaceholderInput,
} = require('./user-interaction.cjs');
const {
  checkDocLinkPlaceholderRequirements,
  normalizeDocLinkPlaceholderInput,
} = require('./package-file-interaction.cjs');

async function runDocLinkPlaceholderCycle(config = {}) {
  const configWithInput = await collectDocLinkPlaceholderInput(config);
  const configWithCleanInput = cleanDocLinkPlaceholderInput(configWithInput);
  const configWithCheckedRequirements =
    checkDocLinkPlaceholderRequirements(configWithCleanInput);

  return normalizeDocLinkPlaceholderInput(configWithCheckedRequirements);
}

module.exports = {
  runDocLinkPlaceholderCycle,
};
