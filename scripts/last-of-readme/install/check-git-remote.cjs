#!/usr/bin/env node

const {
  checkGitRemoteRequirements,
  finalizeRemoteState,
} = require('./step-logic-git.cjs');

async function checkGitRemote(pipelineState = {}) {

  pipelineState = checkGitRemoteRequirements(pipelineState);

  return finalizeRemoteState(pipelineState);
}

module.exports = {
  checkGitRemote,
};
