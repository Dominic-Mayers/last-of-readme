#!/usr/bin/env node

const {
  collectExistingInstallationEnvironmentInput,
  finalizeExistingInstallationState,
} = require('./step-logic-npm.cjs');
const {
  checkExistingInstallationRequirements,
} = require('./step-logic-user-input.cjs');

async function checkExistingInstallation(pipelineState = {}) {

  pipelineState = collectExistingInstallationEnvironmentInput(pipelineState);
  pipelineState = await checkExistingInstallationRequirements(pipelineState);

  return finalizeExistingInstallationState(pipelineState);
}

module.exports = {
  checkExistingInstallation,
};
