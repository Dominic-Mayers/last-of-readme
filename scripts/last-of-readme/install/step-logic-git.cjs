#!/usr/bin/env node

const {
  assertCanDryRunPublishTag,
} = require('../adapters/git-adapter.cjs');

function collectRemoteEnvironmentInput(config = {}) {
  const localName = config?.remote?.localName;
  const repositoryUrl = config?.remote?.repositoryUrl;
  const repositoryApiUrl = config?.remote?.repositoryApiUrl;
  const repositoryBrowserUrl = config?.remote?.repositoryBrowserUrl;

  if (!localName || typeof localName !== 'string') {
    return config;
  }

  return {
    ...config,
    remote: {
      ...config.remote,
      localName,
      repositoryUrl,
      repositoryApiUrl,
      repositoryBrowserUrl,
    },
  };
}

function prepareRemoteEnvironmentInput(config = {}) {
  return {
    ...config,
    remote: {
      ...(config.remote || {}),
      repositoryApiUrl: normalizeUrl(config?.remote?.repositoryApiUrl),
      repositoryBrowserUrl: normalizeUrl(config?.remote?.repositoryBrowserUrl),
    },
  };
}

function checkGitRemoteRequirements(config = {}) {
  const localName = config?.remote?.localName;

  if (!localName || typeof localName !== 'string') {
    throw new Error('A Git remote must be selected for Last of Readme');
  }

  const repositoryUrl = config?.remote?.repositoryUrl;

  if (!repositoryUrl) {
    throw new Error(`Selected Git remote does not exist: ${localName}`);
  }

  assertCanDryRunPublishTag(localName);

  assertHttpUrl(
    config?.remote?.repositoryApiUrl,
    'A GitHub repository API URL must be provided for Last of Readme'
  );
  assertHttpUrl(
    config?.remote?.repositoryBrowserUrl,
    'A GitHub repository browser URL must be provided for Last of Readme'
  );

  return config;
}

function finalizeRemoteState(config = {}) {
  const localName = config?.remote?.localName;
  const repositoryUrl = config?.remote?.repositoryUrl;
  const repositoryApiUrl = config?.remote?.repositoryApiUrl;
  const repositoryBrowserUrl = config?.remote?.repositoryBrowserUrl;

  return {
    ...config,
    remote: {
      localName,
      repositoryUrl,
      kind: 'github',
      repositoryApiUrl,
      repositoryBrowserUrl,
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
  collectRemoteEnvironmentInput,
  prepareRemoteEnvironmentInput,
  checkGitRemoteRequirements,
  finalizeRemoteState,
};
