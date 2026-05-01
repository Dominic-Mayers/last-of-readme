#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runNpmPkg } = require('../runNpmPkg.cjs');

const WORKSPACE_ROOT = process.cwd();
const PACKAGE_PATH = path.join(WORKSPACE_ROOT, 'package.json');

function configuredRemoteName() {
  // TODO architecture:
  // This reads npm/package configuration to find a Git remote name. It is kept
  // here to preserve behavior while the tag publishing flow is separated into
  // explicit npm and git steps.
  const configuredRemoteName = getPackageJsonField('lastOfReadme.remoteName', {
    allowEmpty: true,
  });

  if (configuredRemoteName && typeof configuredRemoteName === 'string') {
    return configuredRemoteName;
  }

  fail('No Last of Readme remoteName configured in package.json');
}


function npmPackageRoot() {
  try {
    return execFileSync('npm', ['prefix'], {
      cwd: WORKSPACE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    const detail = error && error.stderr ? String(error.stderr).trim() : '';
    const suffix = detail ? `\n${detail}` : '';
    throw new Error(`Could not determine the npm package root${suffix}`);
  }
}

// In update-readme-link.cjs.
function remoteConfiguration() {
  const kind = getPackageJsonField('lastOfReadme.remote.kind', { allowEmpty: true });
  const repositoryApiUrl = getPackageJsonField(
    'lastOfReadme.remote.repositoryApiUrl',
    { allowEmpty: true }
  );
  const repositoryBrowserUrl = getPackageJsonField(
    'lastOfReadme.remote.repositoryBrowserUrl',
    { allowEmpty: true }
  );

  if (kind !== undefined && kind !== null && kind !== '') {
    if (kind !== 'github') {
      fail('package.json lastOfReadme.remote.kind must be "github"');
    }

    if (repositoryApiUrl && repositoryBrowserUrl) {
      return {
        kind: 'github',
        repositoryApiUrl: String(repositoryApiUrl),
        repositoryBrowserUrl: String(repositoryBrowserUrl),
      };
    }

    // Backward-compatible read path for manifests installed by earlier versions.
    const host = getPackageJsonField('lastOfReadme.remote.host', { allowEmpty: true });
    const repository = getPackageJsonField('lastOfReadme.remote.repository', { allowEmpty: true });

    if (host && repository) {
      return githubRemoteUrlsFromHostRepository(String(host), String(repository));
    }

    fail(
      'package.json lastOfReadme.remote must include repositoryApiUrl and repositoryBrowserUrl'
    );
  }

  return deriveGitHubRemoteUrls(getPackageJsonField('repository'));
}

function currentPackageVersion() {
  return String(getPackageJsonField('version'));
}

function packageName() {
  return String(getPackageJsonField('name'));
}

function packageFilePath() {
  const value = getPackageJsonField('lastOfReadme.packageFilePath', { allowEmpty: true });
  if (!value || typeof value !== 'string') {
    fail('package.json has no lastOfReadme.packageFilePath');
  }
  return value;
}

function repositoryUrlPath() {
  const config = getPackageJsonField('lastOfReadme', { allowEmpty: true });

  if (!config || typeof config !== 'object') {
    fail('package.json has no lastOfReadme configuration');
  }

  const value = config.repositoryUrlPath;

  if (typeof value !== 'string') {
    fail('package.json has no valid lastOfReadme.repositoryUrlPath');
  }

  return value;
}

function getCurrentFilesField() {
  const files = getPackageJsonField('files', { allowEmpty: true });
  return Array.isArray(files) ? files : null;
}

function assertPackageManifestReadableByNpm() {
  if (!fs.existsSync(PACKAGE_PATH)) {
    throw new Error('package.json must exist at the repository root');
  }

  try {
    execFileSync('npm', ['pkg', 'get', 'version'], {
      cwd: WORKSPACE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch (error) {
    const detail = error && error.stderr ? String(error.stderr).trim() : '';
    const suffix = detail ? `\n${detail}` : '';
    throw new Error(
      `npm must recognize package.json as the package manifest in this repository${suffix}`
    );
  }
}

function updatePackageJsonFields(updates) {
  const assignments = Object.entries(updates).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`
  );

  runNpmPkg(
    ['set', '--json', ...assignments],
    {
      allowEmpty: true,
      failureMessage: 'Could not update package.json',
    }
  );
}

function getCurrentInstalledPackageFilePath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return null;
  }
  return typeof lastOfReadme.packageFilePath === 'string'
    ? lastOfReadme.packageFilePath
    : null;
}

function getCurrentRepositoryApiUrl() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return '';
  }

  const remote = lastOfReadme.remote;
  return remote && typeof remote.repositoryApiUrl === 'string'
    ? remote.repositoryApiUrl
    : '';
}

function getCurrentRepositoryBrowserUrl() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return '';
  }

  const remote = lastOfReadme.remote;
  return remote && typeof remote.repositoryBrowserUrl === 'string'
    ? remote.repositoryBrowserUrl
    : '';
}

function getCurrentRepositoryUrlPath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return '';
  }
  return typeof lastOfReadme.repositoryUrlPath === 'string'
    ? lastOfReadme.repositoryUrlPath
    : '';
}

function deriveGitHubRemoteUrls(repository) {
  let url =
    typeof repository === 'string'
      ? repository
      : repository && typeof repository.url === 'string'
        ? repository.url
        : null;

  if (!url) {
    fail('package.json has no valid repository.url');
  }

  url = url.trim();

  if (url.startsWith('git+')) {
    url = url.slice(4);
  }

  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  let match = url.match(/^https:\/\/([^/]+)\/([^/]+\/[^/]+)\/?$/);
  if (match) {
    return githubRemoteUrlsFromHostRepository(match[1], match[2]);
  }

  match = url.match(/^git@([^:]+):([^/]+\/[^/]+)$/);
  if (match) {
    return githubRemoteUrlsFromHostRepository(match[1], match[2]);
  }

  match = url.match(/^ssh:\/\/git@([^/]+)\/([^/]+\/[^/]+)$/);
  if (match) {
    return githubRemoteUrlsFromHostRepository(match[1], match[2]);
  }

  fail('repository.url must point to a GitHub repository');
}

function tryDeriveGitHubRemoteUrls(repositoryUrl) {
  try {
    return deriveGitHubRemoteUrls(repositoryUrl);
  } catch {
    return null;
  }
}

function githubRemoteUrlsFromHostRepository(host, repository) {
  const normalizedHost = String(host).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const normalizedRepository = String(repository).replace(/^\/+/, '').replace(/\/+$/, '');
  const apiBase =
    normalizedHost === 'github.com'
      ? 'https://api.github.com'
      : `https://${normalizedHost}/api/v3`;

  return {
    kind: 'github',
    repositoryApiUrl: `${apiBase}/repos/${normalizedRepository}`,
    repositoryBrowserUrl: `https://${normalizedHost}/${normalizedRepository}`,
  };
}

function getPackageJsonField(field, { allowEmpty = false } = {}) {
  const value = runNpmPkg(['get', field, '--json'], { expectJson: true });
  const normalized = Array.isArray(value) && value.length === 1 ? value[0] : value;

  if ((normalized === undefined || normalized === null || normalized === '') && !allowEmpty) {
    fail(`package.json has no ${field}`);
  }

  return normalized;
}

function fail(message) {
  const error = new Error(message);
  error.isWorkspaceApiError = true;
  throw error;
}

module.exports = {
  configuredRemoteName,
  npmPackageRoot,
  remoteConfiguration,
  currentPackageVersion,
  packageName,
  packageFilePath,
  repositoryUrlPath,
  getCurrentFilesField,
  assertPackageManifestReadableByNpm,
  updatePackageJsonFields,
  getCurrentInstalledPackageFilePath,
  getCurrentRepositoryApiUrl,
  getCurrentRepositoryBrowserUrl,
  getCurrentRepositoryUrlPath,
  deriveGitHubRemoteUrls,
  tryDeriveGitHubRemoteUrls
};
