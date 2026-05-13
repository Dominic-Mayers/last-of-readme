#!/usr/bin/env node

const {
  collectLastOfReadmeOwnedVersionHooksEnvironmentInput,
  installLastOfReadmeOwnedVersionHookCommands,
  finalizeLastOfReadmeOwnedVersionHooksInstallationState,
} = require('./step-logic-npm.cjs');
const {
  collectLastOfReadmeOwnedHookInstallationInput,
  reportOwnedHookInstallationResults,
} = require('./step-logic-user-input.cjs');

async function installOwnedVersionHooks(pipelineState = {}) {
  pipelineState = collectLastOfReadmeOwnedVersionHooksEnvironmentInput(pipelineState);
  pipelineState = await collectLastOfReadmeOwnedHookInstallationInput(pipelineState);
  pipelineState = installLastOfReadmeOwnedVersionHookCommands(pipelineState);
  pipelineState = reportOwnedHookInstallationResults(pipelineState);

  return finalizeLastOfReadmeOwnedVersionHooksInstallationState(pipelineState);
}

module.exports = {
  installOwnedVersionHooks,
};
