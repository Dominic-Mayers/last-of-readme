#!/usr/bin/env node

const {
  normalizeOptionalText,
  normalizePackageFilePath,
} = require('./utils.cjs');
const {
  collectRemoteInput,
  collectPackageFilePathInput,
  collectDocLinkPlaceholderInput,
  getCurrentInstalledPackageFilePath,
  getCurrentRepositoryUrlPath,
} = require('../adapters/local-workspace-adapter.cjs');

function prepareRemoteInput(config = {}) {
  return config;
}

function getDefaultPackageFilePath() {
  return getCurrentInstalledPackageFilePath() || 'README.md';
}

function getDefaultRepositoryUrlPath() {
  return getCurrentRepositoryUrlPath() || '';
}

function resolveCollectedPackageFilePathAnswer(packageFilePathAnswer) {
  const defaultPackageFilePath = getDefaultPackageFilePath();
  return normalizeOptionalText(packageFilePathAnswer) || defaultPackageFilePath;
}

function resolveCollectedRepositoryUrlPathAnswer(repositoryUrlPathAnswer) {
  const defaultRepositoryUrlPath = getDefaultRepositoryUrlPath();

  if (repositoryUrlPathAnswer === '') {
    return defaultRepositoryUrlPath;
  }

  return normalizeOptionalText(repositoryUrlPathAnswer);
}

function preparePackageFilePathInput(config = {}) {
  const input = config.docLink || {};
  const resolvedPackageFilePath = resolveCollectedPackageFilePathAnswer(
    input.packageFilePathAnswer
  );

  return {
    ...config,
    docLink: {
      ...input,
      packageFilePath: normalizePackageFilePath(resolvedPackageFilePath),
      repositoryUrlPath: resolveCollectedRepositoryUrlPathAnswer(
        input.repositoryUrlPathAnswer
      ),
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
