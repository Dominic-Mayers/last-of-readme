#!/usr/bin/env node

const {
  collectRemoteInput,
} = require('./collect-user-input.cjs');
const {
  checkRemoteRequirements,
  writeRemoteState,
} = require('./install_remote.cjs');

async function runRemoteCycle(config) {
  let nextConfig = config;
  nextConfig = await collectRemoteInput(nextConfig);
  nextConfig = checkRemoteRequirements(nextConfig);
  nextConfig = writeRemoteState(nextConfig);
  return nextConfig;
}

module.exports = {
  runRemoteCycle,
};
