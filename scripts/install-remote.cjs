#!/usr/bin/env node

const { execFileSync } = require('child_process');
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

function runNpmPkg(args, errorPrefix) {
  try {
    return execFileSync('npm', ['pkg', ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const details = [error.stderr, error.stdout]
      .filter(Boolean)
      .map((value) => String(value).trim())
      .find(Boolean);

    throw new Error(
      details ? `${errorPrefix}: ${details}` : `${errorPrefix}: ${error.message}`
    );
  }
}

function readPackageJson() {
  const raw = runNpmPkg(['get', '--json'], 'Could not read package.json');

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Could not parse package.json content from npm pkg get: ${error.message}`);
  }
}

function setPackageJsonFields(updates) {
  const assignments = Object.entries(updates).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`
  );

  runNpmPkg(['set', '--json', ...assignments], 'Could not update package.json');
}

function installRemotePackageJson(config = {}) {
  const remote = config.remote;

  if (!remote || !remote.localName || !remote.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.remoteName': remote.localName,
    'lastOfReadme.remote.kind': remote.kind,
    'lastOfReadme.remote.host': remote.host,
    'lastOfReadme.remote.repository': remote.repository,
  });

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
  readPackageJson,
};
