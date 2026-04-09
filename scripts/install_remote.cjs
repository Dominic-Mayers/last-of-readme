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

function checkRemoteRequirements(config) {
  const remoteName = config && config.remoteName;

  if (!remoteName || typeof remoteName !== 'string') {
    throw new Error('A Git remote must be selected for Last of Readme');
  }

  let remoteUrl;
  try {
    remoteUrl = gitRemoteUrl(remoteName);
  } catch (error) {
    throw new Error(`Selected Git remote does not exist: ${remoteName}`);
  }

  let remote;
  try {
    remote = normalizeGitHubRemote(remoteUrl);
  } catch (error) {
    throw new Error(
      `Selected Git remote must point to GitHub or GitHub Enterprise for phase 1: ${remoteName} (${remoteUrl})`
    );
  }

  return {
    ...config,
    remoteRequirement: {
      remoteName,
      remoteUrl,
      remote,
    },
  };
}

function writeRemoteState(config) {
  const requirement = config && config.remoteRequirement;

  if (!requirement) {
    throw new Error('remoteRequirement is required before writing remote state');
  }

  return {
    ...config,
    remote: {
      name: requirement.remoteName,
      url: requirement.remoteUrl,
      repository: requirement.remote,
      provider: 'github',
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

function installRemotePackageJson(config) {
  const remoteState = config && config.remote;

  if (!remoteState || !remoteState.name || !remoteState.repository) {
    throw new Error('Remote state must be prepared before automated installation');
  }

  const pkg = readPackageJson();

  pkg.lastOfReadme = pkg.lastOfReadme || {};
  pkg.lastOfReadme.remoteName = remoteState.name;
  pkg.lastOfReadme.remote = remoteState.repository;

  writePackageJson(pkg);

  return {
    path: 'package.json',
    remoteName: remoteState.name,
    remote: remoteState.repository,
  };
}

module.exports = {
  listRemoteChoices,
  checkRemoteRequirements,
  writeRemoteState,
  installRemotePackageJson,
};
