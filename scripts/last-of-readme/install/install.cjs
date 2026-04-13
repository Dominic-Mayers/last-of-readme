#!/usr/bin/env node

const { checkCommonRequirements } = require('./common-requirements.cjs');
const { runRemoteCycle } = require('./repository-url-phase.cjs');
const { runDocLinkCycle } = require('./package-file-phase.cjs');
const { automatedInstall } = require('./apply-installation.cjs');

async function main() {
  checkCommonRequirements();
  console.log('✔ Common requirements satisfied');

  let config = {};
  config = await runRemoteCycle(config);
  config = await runDocLinkCycle(config);

  automatedInstall(config);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
