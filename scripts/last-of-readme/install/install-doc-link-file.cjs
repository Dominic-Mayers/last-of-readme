#!/usr/bin/env node

const {
  createDocLinkFileIfNeeded,
  finalizeDocLinkFileInstallationState,
} = require('./step-logic-filesystem.cjs');

function installDocLinkFile(pipelineState = {}) {
  pipelineState = createDocLinkFileIfNeeded(pipelineState);
  return finalizeDocLinkFileInstallationState(pipelineState);
}

module.exports = {
  installDocLinkFile,
};
