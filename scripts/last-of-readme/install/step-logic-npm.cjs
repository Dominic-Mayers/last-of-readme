#!/usr/bin/env node

const {
  getCurrentConfiguredRemoteName,
  npmPackageRoot,
} = require('../adapters/npm-adapter.cjs');

function collectNpmPackageRootEnvironmentInput(config = {}) {
  return {
    ...config,
    _cwdPackageRootEnvironmentInput: {
      ...(config._cwdPackageRootEnvironmentInput || {}),
      npmPackageRootAnswer: npmPackageRoot(),
    },
  };
}

function collectConfiguredRemoteNameEnvironmentInput(config = {}) {
  const configuredRemoteNameAnswer = getCurrentConfiguredRemoteName();

  return {
    ...config,
    remote: {
      ...(config.remote || {}),
      configuredRemoteName: configuredRemoteNameAnswer,
    },
  };
}

module.exports = {
  collectNpmPackageRootEnvironmentInput,
  collectConfiguredRemoteNameEnvironmentInput,
};
