#!/usr/bin/env node

const {
  configuredRemoteName,
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
  let configuredRemoteNameAnswer = '';

  try {
    configuredRemoteNameAnswer = configuredRemoteName();
  } catch {
    configuredRemoteNameAnswer = '';
  }

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
