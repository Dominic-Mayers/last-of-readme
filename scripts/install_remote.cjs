#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  gitRemoteNames,
  gitRemoteUrl,
  normalizeGitHubRemote,
} = require('./install-utils.cjs');

function listRemoteChoices() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}

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

  let normalizedRemote;
  try {
    normalizedRemote = normalizeGitHubRemote(repositoryUrl);
  } catch (error) {
    throw new Error(
      `Selected Git remote must point to GitHub or GitHub Enterprise for phase 1: ${localName} (${repositoryUrl})`
    );
  }

  return {
    ...config,
    remote: {
      localName,
      repositoryUrl,
      ...normalizedRemote,
    },
  };
}

function getPackageJsonPath() {
  return path.resolve(process.cwd(), 'package.json');
}

function readPackageJson() {
  const packageJsonPath = getPackageJsonPath();
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json was not found in the current workspace');
  }

  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read package.json: ${error.message}`);
  }
}

function writePackageJson(pkg) {
  fs.writeFileSync(getPackageJsonPath(), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

function installRemotePackageJson(config = {}) {
  const remote = config.remote;

  if (!remote || !remote.localName || !remote.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  const pkg = readPackageJson();

  pkg.lastOfReadme = pkg.lastOfReadme || {};
  // Backward-compatible persisted format.
  pkg.lastOfReadme.remoteName = remote.localName;
  pkg.lastOfReadme.remote = {
    kind: remote.kind,
    host: remote.host,
    repository: remote.repository,
  };

  writePackageJson(pkg);

  return {
    path: 'package.json',
    remote: {
      localName: remote.localName,
      kind: remote.kind,
      host: remote.host,
      repository: remote.repository,
    },
  };
}

module.exports = {
  listRemoteChoices,
  checkRemoteRequirements,
  installRemotePackageJson,
};
