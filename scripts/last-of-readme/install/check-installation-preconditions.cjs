#!/usr/bin/env node

const {
  collectExistingInstallationEnvironmentInput,
  finalizeExistingInstallationState,
} = require('./step-logic-npm.cjs');
const {
  checkInstallationPreconditionsRequirements,
} = require('./step-logic-user-input.cjs');

async function checkInstallationPreconditions(pipelineState = {}) {

  pipelineState = collectExistingInstallationEnvironmentInput(pipelineState);
  pipelineState = await checkInstallationPreconditionsRequirements(pipelineState);

  return finalizeExistingInstallationState(pipelineState);
}

module.exports = {
  checkInstallationPreconditions,
};
