#!/usr/bin/env node

const { checkCommonRequirements } = require('./common-requirements.cjs');
const { runRemoteCycle } = require('./repository-url-phase.cjs');
const { runPackageFilePathCycle } = require('./package-file-path-phase.cjs');
const {
  runDocLinkPlaceholderCycle,
} = require('./doc-link-placeholder-phase.cjs');
const { automatedInstall } = require('./apply-installation.cjs');

async function main() {
  checkCommonRequirements();
  console.log('✔ Common requirements satisfied');

  let config = {};
  config = await runRemoteCycle(config);
  config = await runPackageFilePathCycle(config);
  config = await runDocLinkPlaceholderCycle(config);

  automatedInstall(config);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
