#!/usr/bin/env node

const { checkBasicRequirements } = require('./basic-requirements.cjs');
const { runPreInstallationPipeline } = require('./run-pre-installation-pipeline.cjs');
const { runInstallationPerSe } = require('./run-installation-per-se.cjs');
const {
  printAbortMessage,
  printBasicRequirementsSatisfied,
} = require('../driven-adapters/prompt-user-input.cjs');

async function main() {
  checkBasicRequirements();
  printBasicRequirementsSatisfied();
  const pipelineState = await runPreInstallationPipeline();
  await runInstallationPerSe(pipelineState);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  printAbortMessage(message);
  process.exit(1);
});
