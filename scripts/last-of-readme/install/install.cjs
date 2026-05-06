#!/usr/bin/env node

const { checkBasicRequirements } = require('./basic-requirements.cjs');
const { checkGitRemote } = require('./check-git-remote.cjs');
const {
  checkCwdIsPackageRoot,
} = require('./check-cwd-is-package-root.cjs');
const { checkPackageFilePath } = require('./check-package-file-path.cjs');
const {
  checkDocLinkPlaceholder,
} = require('./check-doc-link-placeholder.cjs');
const { automatedInstall } = require('./apply-installation.cjs');

async function main() {
  checkBasicRequirements();
  console.log('✔ Basic requirements satisfied');
  let pipelineState = {};
  pipelineState = checkCwdIsPackageRoot(pipelineState);
  pipelineState = await checkGitRemote(pipelineState);
  pipelineState = await checkPackageFilePath(pipelineState);
  pipelineState = await checkDocLinkPlaceholder(pipelineState);
  automatedInstall(pipelineState);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
