#!/usr/bin/env node

const { remindAboutConvenienceHooks } = require('./remind-not-owned-hooks.cjs');
const { installDocLinkFile } = require('./install-doc-link-file.cjs');
const { installRemoteConfig } = require('./install-remote-config.cjs');
const { installDocLinkConfig } = require('./install-doc-link-config.cjs');
const { installNonInteractivePolicy } = require('./install-non-interactive-policy.cjs');
const { installOwnedVersionHooks } = require('./install-owned-version-hooks.cjs');

async function runInstallationPerSe(pipelineState = {}) {
  pipelineState = installDocLinkFile(pipelineState);
  pipelineState = installRemoteConfig(pipelineState);
  pipelineState = installDocLinkConfig(pipelineState);
  pipelineState = installNonInteractivePolicy(pipelineState);
  pipelineState = await installOwnedVersionHooks(pipelineState);
  remindAboutConvenienceHooks(pipelineState);
}

module.exports = {
  runInstallationPerSe,
};
