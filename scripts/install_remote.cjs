#!/usr/bin/env node

const {
  gitRemoteNames,
  gitRemoteUrl,
  normalizeGitHubRepository,
} = require('./install-utils.cjs');

function listRemoteChoices() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}

function checkRemoteRequirements(config) {
  const remoteName = config && config.remoteName;

  if (!remoteName || typeof remoteName !== 'string') {
    throw new Error('A Git remote must be selected for Last of Readme');
  }

  let url;
  try {
    url = gitRemoteUrl(remoteName);
  } catch (error) {
    throw new Error(`Selected Git remote does not exist: ${remoteName}`);
  }

  try {
    const repository = normalizeGitHubRepository(url);
    return {
      remoteName,
      remoteUrl: url,
      repository,
    };
  } catch (error) {
    throw new Error(
      `Selected Git remote must point to GitHub for phase 1: ${remoteName} (${url})`
    );
  }
}

module.exports = {
  listRemoteChoices,
  checkRemoteRequirements,
};
