#!/usr/bin/env node

const {
  collectRemoteInput,
  cleanRemoteInput,
} = require('./user-interaction.cjs');
const {
  checkRemoteRequirements,
  normalizeRemoteInput,
} = require('./repository-url-interaction.cjs');

async function runRemoteCycle(config = {}) {
  const configWithInput = await collectRemoteInput(config);
  const cleanedConfig = cleanRemoteInput(configWithInput);
  const checkedConfig = checkRemoteRequirements(cleanedConfig);

  return normalizeRemoteInput(checkedConfig);
}

module.exports = {
  runRemoteCycle,
};
