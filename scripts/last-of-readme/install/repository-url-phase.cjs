#!/usr/bin/env node

const { collectRemoteInput } = require('./collect-user-input.cjs');
const { checkRemoteRequirements } = require('./repository-url-requirements.cjs');

async function runRemoteCycle(config = {}) {
  const withInput = await collectRemoteInput(config);
  return checkRemoteRequirements(withInput);
}

module.exports = {
  runRemoteCycle,
};
