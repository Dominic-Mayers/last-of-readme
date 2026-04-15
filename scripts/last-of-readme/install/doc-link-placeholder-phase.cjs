#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
} = require('./collect-user-input.cjs');
const {
  checkDocLinkPlaceholderRequirements,
} = require('./package-file-requirements.cjs');

async function runDocLinkPlaceholderCycle(config = {}) {
  const configWithInput = await collectDocLinkPlaceholderInput(config);
  const configWithDocLinkState =
    checkDocLinkPlaceholderRequirements(configWithInput);

  return configWithDocLinkState;
}

module.exports = {
  runDocLinkPlaceholderCycle,
};
