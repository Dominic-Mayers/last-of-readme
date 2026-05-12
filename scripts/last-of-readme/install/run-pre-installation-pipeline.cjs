#!/usr/bin/env node

const { checkCwdIsPackageRoot } = require('./check-cwd-is-package-root.cjs');
const { checkInstallationPreconditions } = require('./check-installation-preconditions.cjs');
const { checkRemoteNameConfig } = require('./check-remote-name-config.cjs');
const { checkRemoteUrlsConfig } = require('./check-remote-urls-config.cjs');
const { checkGitRemote } = require('./check-git-remote.cjs');
const { checkPackageFilePathConfig } = require('./check-package-file-path-config.cjs');
const { checkPackageFilePath } = require('./check-package-file-path.cjs');
const { checkLinkPlaceholder } = require('./check-link-placeholder.cjs');

async function runPreInstallationPipeline() {
  let pipelineState = {
    config: {},
    control: {},
  };
  pipelineState = checkCwdIsPackageRoot(pipelineState);
  pipelineState = await checkInstallationPreconditions(pipelineState);
  pipelineState = await checkRemoteNameConfig(pipelineState);
  pipelineState = await checkRemoteUrlsConfig(pipelineState);
  pipelineState = await checkGitRemote(pipelineState);
  pipelineState = await checkPackageFilePathConfig(pipelineState);
  pipelineState = await checkPackageFilePath(pipelineState);
  pipelineState = await checkLinkPlaceholder(pipelineState);
  return pipelineState;
}

module.exports = {
  runPreInstallationPipeline,
};
