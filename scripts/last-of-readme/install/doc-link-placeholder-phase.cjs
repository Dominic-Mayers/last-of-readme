#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
  cleanDocLinkPlaceholderInput,
} = require('./collect-user-input.cjs');
const {
  checkDocLinkPlaceholderRequirements,
  normalizeDocLinkPlaceholderInput,
} = require('./package-file-requirements.cjs');

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
