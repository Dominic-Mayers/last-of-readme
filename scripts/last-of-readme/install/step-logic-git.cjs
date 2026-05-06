#!/usr/bin/env node

const {
  assertCanDryRunPublishTag,
  getRemotesFromGit,
} = require('../adapters/git-adapter.cjs');

function collectGitRemotesEnvironmentInput(pipelineState = {}) {
  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      availableRemotes: getRemotesFromGit(),
    },
  };
}

function collectRemoteEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};

  if (!control.localName || typeof control.localName !== 'string') {
    return pipelineState;
  }

  return pipelineState;
}

function prepareRemoteEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};

  return {
    ...pipelineState,
    control: {
      ...control,
      repositoryApiUrl: normalizeUrl(control.repositoryApiUrl),
      repositoryBrowserUrl: normalizeUrl(control.repositoryBrowserUrl),
    },
  };
}

function checkGitRemoteRequirements(pipelineState = {}) {
  const control = pipelineState.control || {};
  const localName = control.localName;

  if (!localName || typeof localName !== 'string') {
    throw new Error('A Git remote must be selected for Last of Readme');
  }

  const repositoryUrl = control.repositoryUrl;

  if (!repositoryUrl) {
    throw new Error(`Selected Git remote does not exist: ${localName}`);
  }

  assertCanDryRunPublishTag(localName);

  assertHttpUrl(
    control.repositoryApiUrl,
    'A GitHub repository API URL must be provided for Last of Readme'
  );
  assertHttpUrl(
    control.repositoryBrowserUrl,
    'A GitHub repository browser URL must be provided for Last of Readme'
  );

  return pipelineState;
}

function finalizeRemoteState(pipelineState = {}) {
  const control = pipelineState.control || {};
  const config = pipelineState.config || {};

  return {
    ...pipelineState,
    config: {
      ...config,
      git: {
        ...(config.git || {}),
        remoteName: control.localName,
      },
      remoteRepository: {
        ...(config.remoteRepository || {}),
        kind: 'github',
        repositoryApiUrl: control.repositoryApiUrl,
        repositoryBrowserUrl: control.repositoryBrowserUrl,
      },
    },
  };
}

function normalizeUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function assertHttpUrl(value, message) {
  if (!value || typeof value !== 'string') {
    throw new Error(message);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${message}: ${value}`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${message}: ${value}`);
  }
}

module.exports = {
  collectGitRemotesEnvironmentInput,
  collectRemoteEnvironmentInput,
  prepareRemoteEnvironmentInput,
  checkGitRemoteRequirements,
  finalizeRemoteState,
};
