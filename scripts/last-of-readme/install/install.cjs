#!/usr/bin/env node

const { checkBasicRequirements } = require('./basic-requirements.cjs');
const { checkCwdIsPackageRoot } = require('./check-cwd-is-package-root.cjs');
const { checkRemoteNameConfig } = require('./check-remote-name-config.cjs');
const { checkRemoteUrlsConfig } = require('./check-remote-urls-config.cjs');
const { checkGitRemote } = require('./check-git-remote.cjs');
const { checkPackageFilePath } = require('./check-package-file-path.cjs');
const { checkLinkPlaceholder } = require('./check-link-placeholder.cjs');
const { automatedInstall } = require('./apply-installation.cjs');

async function main() {
  checkBasicRequirements();
  console.log('✔ Basic requirements satisfied');
  let pipelineState = {
    config: {},
    control: {},
  };
  pipelineState = checkCwdIsPackageRoot(pipelineState);
  pipelineState = await checkRemoteNameConfig(pipelineState);
  pipelineState = await checkRemoteUrlsConfig(pipelineState);
  pipelineState = await checkGitRemote(pipelineState);
  pipelineState = await checkPackageFilePath(pipelineState);
  pipelineState = await checkLinkPlaceholder(pipelineState);
  automatedInstall(pipelineState);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
