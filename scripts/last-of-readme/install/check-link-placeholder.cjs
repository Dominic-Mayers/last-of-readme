#!/usr/bin/env node

const {
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
} = require('./step-logic-user-input.cjs');
const {
  collectDocLinkPlaceholderEnvironmentInput,
  prepareDocLinkPlaceholderEnvironmentInput,
  checkLinkPlaceholderRequirements,
  finalizeDocLinkPlaceholderState,
} = require('./step-logic-filesystem.cjs');

async function checkLinkPlaceholder(pipelineState = {}) {

  pipelineState = await collectDocLinkPlaceholderInput(pipelineState);
  pipelineState = prepareDocLinkPlaceholderInput(pipelineState);
  pipelineState = collectDocLinkPlaceholderEnvironmentInput(pipelineState);
  pipelineState = prepareDocLinkPlaceholderEnvironmentInput(pipelineState);
  pipelineState = checkLinkPlaceholderRequirements(pipelineState);
  
  return finalizeDocLinkPlaceholderState(pipelineState);
}

module.exports = {
  checkLinkPlaceholder,
};
