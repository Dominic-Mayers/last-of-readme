#!/usr/bin/env node

const {
  collectRemoteInput,
  prepareRemoteInput,
} = require('./user-interaction.cjs');
const {
  checkRemoteRequirements,
  finalizeRemoteState,
} = require('./repository-url-interaction.cjs');

async function runRemoteCycle(config = {}) {
  const configWithInput = await collectRemoteInput(config);
  const preparedConfig = prepareRemoteInput(configWithInput);
  const checkedConfig = checkRemoteRequirements(preparedConfig);

  return finalizeRemoteState(checkedConfig);
}

module.exports = {
  runRemoteCycle,
};
