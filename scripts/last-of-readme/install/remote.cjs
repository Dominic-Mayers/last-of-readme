#!/usr/bin/env node

const { execFileSync } = require('child_process');
const {
  gitRemoteNames,
  gitRemoteUrl,
  normalizeGitHubRemote,
} = require('./utils.cjs');

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

function runNpmPkg(args, failureMessage, { expectJson = false } = {}) {
  const { spawnSync } = require('child_process');

  const result = spawnSync('npm', ['pkg', ...args], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(`${failureMessage}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(
      `${failureMessage}${detail ? `: ${detail}` : ''}`
    );
  }

  const raw = result.stdout ?? '';

  if (!expectJson) {
    return raw;
  }

  if (raw === '') {
    throw new Error(`${failureMessage}: npm pkg ${args.join(' ')} returned no output`);
  }

  try {
    return JSON.parse(raw.trim());
  } catch (error) {
    throw new Error(`${failureMessage}: ${error.message}`);
  }
}

function readPackageJson() {
  const raw = runNpmPkg(
    ['get', field, '--json'],
    `Could not read package.json field "${field}"`,
    { expectJson: true }
  );

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
