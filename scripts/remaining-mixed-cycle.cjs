#!/usr/bin/env node

const {
  collectDocLinkInput,
} = require('./collect-user-input.cjs');
const {
  checkDocLinkRequirements,
  checkDocLinkPackageJsonRequirements,
} = require('./install-doc-link.cjs');

function writeRemainingMixedState(config) {
  return config;
}

async function runRemainingMixedCycle(config) {
  let nextConfig = config;
  nextConfig = await collectDocLinkInput(nextConfig);
  checkDocLinkRequirements(nextConfig);
  checkDocLinkPackageJsonRequirements(nextConfig);
  nextConfig = writeRemainingMixedState(nextConfig);
  return nextConfig;
}

module.exports = {
  runRemainingMixedCycle,
  writeRemainingMixedState,
};
