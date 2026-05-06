#!/usr/bin/env node

const {
  normalizeOptionalText,
  normalizePackageFilePath,
} = require('./utils.cjs');
const {
  collectRemoteInput,
  collectPackageFilePathInput,
  collectDocLinkPlaceholderInput,
} = require('../adapters/user-input-adapter.cjs');

function prepareRemoteInput(pipelineState = {}) {
  return pipelineState;
}

function resolvePackageFilePathFromCollectedInput({
  packageFilePathAnswer,
  defaultPackageFilePath,
}) {
  return normalizeOptionalText(packageFilePathAnswer) || defaultPackageFilePath;
}

function resolveRepositoryUrlPathFromCollectedInput({
  repositoryUrlPathAnswer,
  defaultRepositoryUrlPath,
}) {
  if (repositoryUrlPathAnswer === '') {
    return defaultRepositoryUrlPath || '';
  }

  return normalizeOptionalText(repositoryUrlPathAnswer);
}

function preparePackageFilePathInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const config = pipelineState.config || {};
  const resolvedPackageFilePath = resolvePackageFilePathFromCollectedInput({
    packageFilePathAnswer: control.packageFilePathAnswer,
    defaultPackageFilePath: control.defaultPackageFilePath,
  });
  const packageFilePath = normalizePackageFilePath(resolvedPackageFilePath);
  const repositoryUrlPath = resolveRepositoryUrlPathFromCollectedInput({
    repositoryUrlPathAnswer: control.repositoryUrlPathAnswer,
    defaultRepositoryUrlPath: control.defaultRepositoryUrlPath,
  });

  return {
    ...pipelineState,
    config: {
      ...config,
      npm: {
        ...(config.npm || {}),
        packageFilePath,
        repositoryUrlPath,
      },
    },
  };
}

function prepareDocLinkPlaceholderInput(pipelineState = {}) {
  return pipelineState;
}

module.exports = {
  collectRemoteInput,
  prepareRemoteInput,
  collectPackageFilePathInput,
  preparePackageFilePathInput,
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
};
