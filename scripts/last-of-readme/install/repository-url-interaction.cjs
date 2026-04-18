#!/usr/bin/env node

const {
  gitRemoteUrl,
  normalizeGitHubRemote,
} = require('./utils.cjs');

function checkRemoteRequirements(config = {}) {
  const localName = config?.remote?.localName;

  if (!localName || typeof localName !== 'string') {
    throw new Error('A Git remote must be selected for Last of Readme');
  }

  let repositoryUrl;
  try {
    repositoryUrl = gitRemoteUrl(localName);
  } catch (error) {
    throw new Error(`Selected Git remote does not exist: ${localName}`);
  }

  try {
    normalizeGitHubRemote(repositoryUrl);
  } catch (error) {
    throw new Error(
      `Selected Git remote must point to GitHub or GitHub Enterprise for phase 1: ${localName} (${repositoryUrl})`
    );
  }

  return config;
}

function finalizeRemoteState(config = {}) {
  const localName = config?.remote?.localName;
  const repositoryUrl = gitRemoteUrl(localName);
  const normalizedRemote = normalizeGitHubRemote(repositoryUrl);

  return {
    ...config,
    remote: {
      localName,
      repositoryUrl,
      ...normalizedRemote,
    },
  };
}

module.exports = {
  checkRemoteRequirements,
  finalizeRemoteState,
};
