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

  let url;
  try {
    url = gitRemoteUrl(remoteName);
  } catch (error) {
    throw new Error(`Selected Git remote does not exist: ${remoteName}`);
  }

  try {
    const remote = normalizeGitHubRemote(url);
    return {
      remoteName,
      remoteUrl: url,
      remote,
    };
  } catch (error) {
    throw new Error(
      `Selected Git remote must point to GitHub or GitHub Enterprise for phase 1: ${remoteName} (${url})`
    );
  }
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
  const requirement = checkRemoteRequirements(config);
  const pkg = readPackageJson();

  pkg.lastOfReadme = pkg.lastOfReadme || {};
  pkg.lastOfReadme.remoteName = requirement.remoteName;
  pkg.lastOfReadme.remote = requirement.remote;

  writePackageJson(pkg);

  return {
    path: 'package.json',
    remoteName: requirement.remoteName,
    remote: requirement.remote,
  };
}

module.exports = {
  listRemoteChoices,
  checkRemoteRequirements,
  installRemotePackageJson,
};
