#!/usr/bin/env node

const { checkCommonRequirements } = require('./install-common-requirements.cjs');
const { runRemoteCycle } = require('./remote-cycle.cjs');
const { runDocLinkCycle } = require('./doc-link-cycle.cjs');
const { automatedInstall } = require('./automated-install.cjs');

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
