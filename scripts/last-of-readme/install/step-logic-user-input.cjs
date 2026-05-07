#!/usr/bin/env node

const {
  normalizeOptionalText,
  normalizePackageFilePath,
} = require('./utils.cjs');
const {
  collectRemoteInput,
  collectRemoteUrlsInput,
  collectPackageFilePathInput,
  collectDocLinkPlaceholderInput,
} = require('../adapters/user-input-adapter.cjs');
const {
  tryDeriveGitHubUrlsFromRemoteUrl,
} = require('../adapters/npm-adapter.cjs');

function prepareRemoteInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const remotes = Array.isArray(control.availableRemotes)
    ? control.availableRemotes
    : [];
  const selectedRemote = resolveSelectedRemote(
    control.remoteAnswer,
    remotes,
    control.defaultRemoteName
  );

  return {
    ...pipelineState,
    control: {
      ...control,
      localName: selectedRemote ? selectedRemote.name : null,
      repositoryUrl: selectedRemote ? selectedRemote.url : null,
    },
  };
}

function prepareRemoteDefaultsInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const currentRemoteConfiguration = control.currentRemoteConfiguration;
  const derivedRemoteConfiguration = control.repositoryUrl
    ? tryDeriveGitHubUrlsFromRemoteUrl(control.repositoryUrl)
    : null;
  const defaultRepositoryApiUrl =
    (currentRemoteConfiguration
      ? currentRemoteConfiguration.repositoryApiUrl
      : '') ||
    (derivedRemoteConfiguration
      ? derivedRemoteConfiguration.repositoryApiUrl
      : '');
  const defaultRepositoryBrowserUrl =
    (currentRemoteConfiguration
      ? currentRemoteConfiguration.repositoryBrowserUrl
      : '') ||
    (derivedRemoteConfiguration
      ? derivedRemoteConfiguration.repositoryBrowserUrl
      : '');

  return {
    ...pipelineState,
    control: {
      ...control,
      defaultRepositoryApiUrl,
      defaultRepositoryBrowserUrl,
    },
  };
}

function prepareRemoteUrlsInput(pipelineState = {}) {
  const control = pipelineState.control || {};

  return {
    ...pipelineState,
    control: {
      ...control,
      repositoryApiUrl: resolveCollectedUrlAnswer(
        control.repositoryApiUrlAnswer,
        control.defaultRepositoryApiUrl
      ),
      repositoryBrowserUrl: resolveCollectedUrlAnswer(
        control.repositoryBrowserUrlAnswer,
        control.defaultRepositoryBrowserUrl
      ),
    },
  };
}

function resolveSelectedRemote(answer, remotes, defaultRemoteName) {
  const trimmed = normalizeOptionalText(answer);
  const value = trimmed || defaultRemoteName;

  if (!value) {
    return null;
  }

  if (['none', 'no', 'skip'].includes(value.toLowerCase())) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    const index = Number(value) - 1;

    if (index >= 0 && index < remotes.length) {
      return remotes[index];
    }

    throw new Error('Please choose a listed remote by number or by name');
  }

  const byName = remotes.find(({ name }) => name === value);

  if (byName) {
    return byName;
  }

  throw new Error('Please choose a listed remote by number or by name');
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
      packageFilePath,
      repositoryUrlPath,
    },
  };
}

function prepareDocLinkPlaceholderInput(pipelineState = {}) {
  return pipelineState;
}

function resolveCollectedUrlAnswer(answer, defaultValue) {
  return normalizeUrl(normalizeOptionalText(answer) || defaultValue || '');
}

function normalizeUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

module.exports = {
  collectRemoteInput,
  collectRemoteUrlsInput,
  prepareRemoteInput,
  prepareRemoteDefaultsInput,
  prepareRemoteUrlsInput,
  collectPackageFilePathInput,
  preparePackageFilePathInput,
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
};
