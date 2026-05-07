#!/usr/bin/env node

const {
  getCurrentConfiguredRemoteName,
  getCurrentFilesField,
  getCurrentInstalledPackageFilePath,
  getCurrentRemoteConfiguration,
  getCurrentRepositoryUrlPath,
  npmPackageRoot,
} = require('../adapters/npm-adapter.cjs');

function collectNpmPackageRootEnvironmentInput(pipelineState = {}) {
  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      npmPackageRootAnswer: npmPackageRoot(),
    },
  };
}

function collectConfiguredRemoteNameEnvironmentInput(pipelineState = {}) {
  const configuredRemoteNameAnswer = getCurrentConfiguredRemoteName();

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      configuredRemoteNameAnswer,
    },
  };
}

function collectCurrentRemoteConfigurationEnvironmentInput(pipelineState = {}) {
  const currentRemoteConfiguration = getCurrentRemoteConfiguration();

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      currentRemoteConfiguration,
    },
  };
}

function collectPackageFilePathDefaultsEnvironmentInput(pipelineState = {}) {
  const previousPackageFilePath = getCurrentInstalledPackageFilePath();
  const currentFiles = getCurrentFilesField();
  const defaultPackageFilePath = previousPackageFilePath || 'README.md';
  const defaultRepositoryUrlPath = getCurrentRepositoryUrlPath() || '';

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      previousPackageFilePath,
      currentFiles,
      defaultPackageFilePath,
      defaultRepositoryUrlPath,
    },
  };
}

module.exports = {
  collectNpmPackageRootEnvironmentInput,
  collectConfiguredRemoteNameEnvironmentInput,
  collectCurrentRemoteConfigurationEnvironmentInput,
  collectPackageFilePathDefaultsEnvironmentInput,
};
