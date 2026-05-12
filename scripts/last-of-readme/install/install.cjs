#!/usr/bin/env node

const { checkBasicRequirements } = require('./basic-requirements.cjs');
const { runPreInstallationPipeline } = require('./run-pre-installation-pipeline.cjs');
const { automatedInstall } = require('./apply-installation.cjs');

async function main() {
  checkBasicRequirements();
  console.log('✔ Basic requirements satisfied');
  const pipelineState = await runPreInstallationPipeline();
  await automatedInstall(pipelineState);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
