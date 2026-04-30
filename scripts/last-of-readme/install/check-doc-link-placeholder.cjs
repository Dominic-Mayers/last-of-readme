#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
} = require('./step-logic-user-input.cjs');
const {
  collectDocLinkPlaceholderEnvironmentInput,
  prepareDocLinkPlaceholderEnvironmentInput,
  checkDocLinkPlaceholderRequirements,
  finalizeDocLinkPlaceholderState,
} = require('./step-logic-filesystem.cjs');

async function checkDocLinkPlaceholder(config = {}) {

  config = await collectDocLinkPlaceholderInput(config);
  config = prepareDocLinkPlaceholderInput(config);
  config = collectDocLinkPlaceholderEnvironmentInput(config);
  config = prepareDocLinkPlaceholderEnvironmentInput(config);
  config = checkDocLinkPlaceholderRequirements(config);
  
  return finalizeDocLinkPlaceholderState(config);
}

module.exports = {
  checkDocLinkPlaceholder,
};
