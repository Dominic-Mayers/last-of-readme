#!/usr/bin/env node

const {
  normalizeOptionalText,
  normalizePackageFilePath,
} = require('./utils.cjs');
const {
  collectRemoteInput,
  collectRemoteUrlsInput,
  tryDeriveGitHubUrlsFromRemoteUrl,
  collectPackageFilePathInput,
  collectDocLinkPlaceholderInput,
  checkInstallationPreconditionsConsentInput,
} = require('../adapters/user-input-adapter.cjs');

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



// Convenience commands that Last of Readme needs in the user's scripts hooks.
// These are non-fingerprinted and may interfere with existing workflows.
// User-visible explanations for these needs live in prompt-user-input.cjs.
const CONVENIENCE_NEEDS = [
  {
    kind: 'stagePackageFileBeforeVersionCommit',
    hook: 'version',
    command: 'node scripts/git-add-readme.cjs',
  },
  {
    kind: 'pushTagsAfterVersion',
    hook: 'postversion',
    command: 'git push --follow-tags',
  },
];

async function checkInstallationPreconditionsRequirements(pipelineState = {}) {
  const control = pipelineState.control || {};

  const existingInstallation = control.existingInstallationDetected
    ? control.existingInstallationDetails
    : null;

  // Only present convenience needs that are relevant — i.e. the hook doesn't
  // already contain the command or a similar one.
  const convenienceNeeds = CONVENIENCE_NEEDS;

  // Skip prompt entirely if there is nothing to warn about.
  if (!existingInstallation && convenienceNeeds.length === 0) {
    return {
      ...pipelineState,
      control: {
        ...control,
        convenienceNeeds,
      },
    };
  }

  const answer = await checkInstallationPreconditionsConsentInput({
    existingInstallation,
    convenienceNeeds,
  });

  const normalized = (answer || '').trim().toLowerCase();
  const consented = ['y', 'yes'].includes(normalized);

  if (!consented) {
    throw new Error('Installation aborted. You can run the installer again when you are ready.');
  }

  return {
    ...pipelineState,
    control: {
      ...control,
      convenienceNeeds,
    },
  };
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
  checkInstallationPreconditionsRequirements,
};
