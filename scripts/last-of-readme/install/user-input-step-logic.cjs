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

function prepareRemoteInput(config = {}) {
  return config;
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

function preparePackageFilePathInput(config = {}) {
  const input = config.docLink || {};
  const resolvedPackageFilePath = resolvePackageFilePathFromCollectedInput({
    packageFilePathAnswer: input.packageFilePathAnswer,
    defaultPackageFilePath: input.defaultPackageFilePath,
  });

  return {
    ...config,
    docLink: {
      ...input,
      packageFilePath: normalizePackageFilePath(resolvedPackageFilePath),
      repositoryUrlPath: resolveRepositoryUrlPathFromCollectedInput({
        repositoryUrlPathAnswer: input.repositoryUrlPathAnswer,
        defaultRepositoryUrlPath: input.defaultRepositoryUrlPath,
      }),
    },
  };
}

function prepareDocLinkPlaceholderInput(config = {}) {
  return config;
}

module.exports = {
  collectRemoteInput,
  prepareRemoteInput,
  collectPackageFilePathInput,
  preparePackageFilePathInput,
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
};
