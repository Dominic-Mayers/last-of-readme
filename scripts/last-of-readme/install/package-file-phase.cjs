#!/usr/bin/env node

const { collectDocLinkInput } = require('./collect-user-input.cjs');
const {
  checkDocLinkRequirements,
} = require('./package-file-requirements.cjs');

async function runDocLinkCycle(config = {}) {
  const withInput = await collectDocLinkInput(config);
  const withDocLinkState = checkDocLinkRequirements(withInput);
  return withDocLinkState;
}

module.exports = {
  runDocLinkCycle,
};
