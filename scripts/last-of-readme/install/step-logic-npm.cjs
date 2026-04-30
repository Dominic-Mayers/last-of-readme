#!/usr/bin/env node

const {
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

module.exports = {
  collectNpmPackageRootEnvironmentInput,
};
