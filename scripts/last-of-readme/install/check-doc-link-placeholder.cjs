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

async function checkDocLinkPlaceholder(pipelineState = {}) {

  pipelineState = await collectDocLinkPlaceholderInput(pipelineState);
  pipelineState = prepareDocLinkPlaceholderInput(pipelineState);
  pipelineState = collectDocLinkPlaceholderEnvironmentInput(pipelineState);
  pipelineState = prepareDocLinkPlaceholderEnvironmentInput(pipelineState);
  pipelineState = checkDocLinkPlaceholderRequirements(pipelineState);
  
  return finalizeDocLinkPlaceholderState(pipelineState);
}

module.exports = {
  checkDocLinkPlaceholder,
};
