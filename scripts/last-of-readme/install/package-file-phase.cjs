#!/usr/bin/env node

const { collectDocLinkInput } = require('./collect-user-input.cjs');
const {
  checkDocLinkRequirements,
  checkDocLinkPackageJsonRequirements,
} = require('./doc-link.cjs');

async function runDocLinkCycle(config = {}) {
  const withInput = await collectDocLinkInput(config);
  const withDocLinkState = checkDocLinkRequirements(withInput);
  checkDocLinkPackageJsonRequirements(withDocLinkState);
  return withDocLinkState;
}

module.exports = {
  runDocLinkCycle,
};
