#!/usr/bin/env node

const {
  installRemoteConfigFields,
  finalizeRemoteConfigInstallationState,
} = require('./step-logic-npm.cjs');

function installRemoteConfig(pipelineState = {}) {
  pipelineState = installRemoteConfigFields(pipelineState);
  return finalizeRemoteConfigInstallationState(pipelineState);
}

module.exports = {
  installRemoteConfig,
};
