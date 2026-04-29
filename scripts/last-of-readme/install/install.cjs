#!/usr/bin/env node

const { checkCommonRequirements } = require('./basic-requirements.cjs');
const { checkGitRemote } = require('./repository-url-phase.cjs');
const {
  checkCwdIsPackageRoot,
} = require('./cwd-package-root-phase.cjs');
const { checkPackageFilePath } = require('./package-file-path-phase.cjs');
const {
  checkDocLinkPlaceholder,
} = require('./doc-link-placeholder-phase.cjs');
const { automatedInstall } = require('./apply-installation.cjs');

async function main() {
  checkCommonRequirements();
  console.log('✔ Common requirements satisfied');
  let config = {};
  config = checkCwdIsPackageRoot(config);
  config = await checkGitRemote(config);
  config = await checkPackageFilePath(config);
  config = await checkDocLinkPlaceholder(config);
  automatedInstall(config);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
