#!/usr/bin/env node

const path = require('path');
const { execFileSync } = require('child_process');
const { runNpmPkg } = require('../runNpmPkg.cjs');

function currentWorkingDirectory() {
  return process.cwd();
}

function gitVersion() {
  return execFileSync('git', ['--version'], {
    cwd: currentWorkingDirectory(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function gitTopLevel() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: currentWorkingDirectory(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}


function normalizeGitHubRemote(remoteUrl) {
  const httpsMatch = String(remoteUrl).match(
    /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i
  );

  if (httpsMatch) {
    const host = httpsMatch[1];
    const owner = httpsMatch[2];
    const repo = httpsMatch[3];

    return {
      kind: host.toLowerCase() === 'github.com' ? 'github' : 'github-enterprise',
      host,
      repository: `${owner}/${repo}`,
    };
  }

  const sshMatch = String(remoteUrl).match(
    /^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/i
  );

  if (sshMatch) {
    const host = sshMatch[1];
    const owner = sshMatch[2];
    const repo = sshMatch[3];

    return {
      kind: host.toLowerCase() === 'github.com' ? 'github' : 'github-enterprise',
      host,
      repository: `${owner}/${repo}`,
    };
  }

  throw new Error(`Unsupported remote URL: ${remoteUrl}`);
}

function getPackageJsonField(fieldPath) {
  const value = runNpmPkg(
    ['get', fieldPath, '--json'],
    { allowFailure: true, expectJson: true, allowEmpty: true }
  );

  if (value === null || value === undefined) {
    return undefined;
  }

  return Array.isArray(value) && value.length === 1 ? value[0] : value;
}

function getCurrentInstalledPackageFilePath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme');
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return null;
  }

  return typeof lastOfReadme.packageFilePath === 'string'
    ? lastOfReadme.packageFilePath
    : null;
}

function getCurrentRepositoryUrlPath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme');
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return '';
  }

  return typeof lastOfReadme.repositoryUrlPath === 'string'
    ? lastOfReadme.repositoryUrlPath
    : '';
}

function getCurrentFilesField() {
  const files = getPackageJsonField('files');
  return Array.isArray(files) ? files : null;
}

function normalizePackageFilePath(packageFilePath) {
  const normalized = normalizeOptionalText(packageFilePath);

  if (!normalized) {
    throw new Error('packageFilePath is required');
  }

  return path.normalize(normalized);
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

module.exports = {
  currentWorkingDirectory,
  gitVersion,
  gitTopLevel,
  normalizeGitHubRemote,
  getPackageJsonField,
  getCurrentInstalledPackageFilePath,
  getCurrentRepositoryUrlPath,
  getCurrentFilesField,
  normalizePackageFilePath,
  normalizeOptionalText,
};
