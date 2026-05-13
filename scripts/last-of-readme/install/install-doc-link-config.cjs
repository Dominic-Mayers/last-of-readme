#!/usr/bin/env node

const {
  installDocLinkConfigFields,
  finalizeDocLinkConfigInstallationState,
} = require('./step-logic-npm.cjs');

function installDocLinkConfig(pipelineState = {}) {
  pipelineState = installDocLinkConfigFields(pipelineState);
  return finalizeDocLinkConfigInstallationState(pipelineState);
}

module.exports = {
  installDocLinkConfig,
};
