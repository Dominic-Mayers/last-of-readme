#!/usr/bin/env node

const path = require('path');

const {
  currentWorkingDirectory,
  npmPackageRoot,
  assertCwdIsPackageRoot,
} = require('../adapters/local-workspace-adapter.cjs');

function collectCwdPackageRootEnvironmentInput(config = {}) {
  return {
    ...config,
    _cwdPackageRootEnvironmentInput: {
      currentWorkingDirectoryAnswer: currentWorkingDirectory(),
      npmPackageRootAnswer: npmPackageRoot(),
    },
  };
}

function prepareCwdPackageRootEnvironmentInput(config = {}) {
  const environmentInput = config._cwdPackageRootEnvironmentInput || {};

  return {
    ...config,
    _cwdPackageRootEnvironmentInput: {
      currentWorkingDirectory: path.resolve(
        String(environmentInput.currentWorkingDirectoryAnswer || '')
      ),
      npmPackageRoot: path.resolve(
        String(environmentInput.npmPackageRootAnswer || '')
      ),
    },
  };
}

function checkCwdPackageRootRequirements(config = {}) {
  const environmentInput = config._cwdPackageRootEnvironmentInput || {};

  assertCwdIsPackageRoot(
    environmentInput.currentWorkingDirectory,
    environmentInput.npmPackageRoot
  );

  return config;
}

function finalizeCwdPackageRootState(config = {}) {
  const { _cwdPackageRootEnvironmentInput, ...configWithoutEnvironmentInput } =
    config;

  return configWithoutEnvironmentInput;
}

module.exports = {
  collectCwdPackageRootEnvironmentInput,
  prepareCwdPackageRootEnvironmentInput,
  checkCwdPackageRootRequirements,
  finalizeCwdPackageRootState,
};
