#!/usr/bin/env node

const {
  installNonInteractivePolicyField,
  finalizeNonInteractivePolicyInstallationState,
} = require('./step-logic-npm.cjs');

function installNonInteractivePolicy(pipelineState = {}) {
  pipelineState = installNonInteractivePolicyField(pipelineState);
  return finalizeNonInteractivePolicyInstallationState(pipelineState);
}

module.exports = {
  installNonInteractivePolicy,
};
