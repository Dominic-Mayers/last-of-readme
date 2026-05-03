#!/usr/bin/env node

/**
 * Adapter over npm used by Last of Readme.
 *
 * The exported operations assume that npm is available and can read its
 * configuration values. This is checked as a basic requirements 
 * assertPackageManifestReadableByNpm().
 *
 */
 
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runNpmPkg } = require('../runNpmPkg.cjs');

const WORKSPACE_ROOT = process.cwd();
const PACKAGE_PATH = path.join(WORKSPACE_ROOT, 'package.json');

/**
 * Asserts that npm can read the package manifest, part of basic requirements.
 *
 * @remarks Simple environmental probe with no Last-of-Readme-specific
 * requirements.
 */
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

/**
 * Reads the previously installed Git remote name for remote-selection defaults.
 *
 * @remarks Requires no current installation; absence of Last of Readme remote
 * configuration is represented as an empty string.
 */
function getCurrentConfiguredRemoteName() {
  const configuredRemoteName = getPackageJsonField('lastOfReadme.remoteName', {
    allowEmpty: true,
  });

  return configuredRemoteName && typeof configuredRemoteName === 'string'
    ? configuredRemoteName
    : '';
}

/**
 * Returns the remote name installed in package.json for tag publication by
 * tag-doc.cjs.
 */
function configuredRemoteName() {
  const remoteName = getCurrentConfiguredRemoteName();

  if (!remoteName) {
    fail('No Last of Readme remoteName configured in package.json');
  }

  return remoteName;
}

/**
 * Collects the npm package root for package-relative path resolution.
 *
 * Used currently by collectNpmPackageRootEnvironmentInput() to support
 * checkCwdIsPackageRootRequirements(). Longer term, this package root should
 * anchor direct resolution of package-relative paths without relying on
 * process cwd.
 *
 * @remarks Simple npm environmental probe with no Last-of-Readme-specific
 * configuration requirements beyond the module-level package-manifest
 * expectation.
 */
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

/**
 * Reads the previously installed repository API/browser URLs for
 * collectRemoteInput() defaults.
 *
 * @remarks Requires no current installation; absence of Last of Readme remote
 * configuration is represented as null.
 */
function getCurrentRemoteConfiguration() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return null;
  }

  const remote = lastOfReadme.remote;
  if (
    !remote ||
    typeof remote.repositoryApiUrl !== 'string' ||
    typeof remote.repositoryBrowserUrl !== 'string'
  ) {
    return null;
  }

  return {
    repositoryApiUrl: remote.repositoryApiUrl,
    repositoryBrowserUrl: remote.repositoryBrowserUrl,
  };
}

/**
 * Returns repository API/browser URLs needed in the resolver link.
 *
 * @remarks If there is eventually a need to tell the resolver what kind of API
 * is offered by the remote, then a kind value might be added. For now, the
 * resolver uses GitHub API endpoints.
 */
function remoteConfiguration() {
  const remote = getCurrentRemoteConfiguration();

  if (!remote) {
    fail('package.json has no valid lastOfReadme.remote configuration');
  }

  return remote;
}

/**
 * Returns the package version used by update-readme-link.cjs and tag-doc.cjs.
 */
function currentPackageVersion() {
  return String(getPackageJsonField('version'));
}

/**
 * Returns the package name used by update-readme-link.cjs to identify the
 * package in resolver links.
 */
function packageName() {
  return String(getPackageJsonField('name'));
}

/**
 * Returns the installed documentation package-file path used by
 * update-readme-link.cjs when no path is supplied on the command line.
 */
function packageFilePath() {
  const value = getCurrentInstalledPackageFilePath();

  if (!value) {
    fail('package.json has no lastOfReadme.packageFilePath');
  }

  return value;
}

/**
 * Returns the installed repository URL path used by update-readme-link.cjs when
 * no URL path is supplied on the command line.
 */
function repositoryUrlPath() {
  const value = getCurrentRepositoryUrlPath();

  if (value === null) {
    fail('package.json has no valid lastOfReadme.repositoryUrlPath');
  }

  return value;
}

/**
 * Reads the current package.json files field for collectPackageFilePathInput()
 * defaults and apply-installation package-file updates.
 *
 * @remarks No Last-of-Readme-specific configuration is required; absence of a
 * files array is represented as null.
 */
function getCurrentFilesField() {
  const files = getPackageJsonField('files', { allowEmpty: true });
  return Array.isArray(files) ? files : null;
}

/**
 * Writes package.json fields during apply-installation.
 *
 * @param {Record<string, unknown>} updates - npm pkg set assignments keyed by
 * package.json field path.
 * @remarks Requires the package manifest to be writable by npm.
 */
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

/**
 * Reads the previously installed package-file path for
 * collectPackageFilePathInput().
 *
 * @remarks Requires no current installation; absence of Last of Readme package
 * configuration is represented as null.
 */
function getCurrentInstalledPackageFilePath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return null;
  }
  return typeof lastOfReadme.packageFilePath === 'string'
    ? lastOfReadme.packageFilePath
    : null;
}

/**
 * Reads the previously installed repository URL path for
 * collectPackageFilePathInput() defaults.
 *
 * @remarks Requires no current installation; absence of Last of Readme package
 * configuration is represented as null.
 */
function getCurrentRepositoryUrlPath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return null;
  }

  return typeof lastOfReadme.repositoryUrlPath === 'string'
    ? lastOfReadme.repositoryUrlPath
    : null;
}

/**
 * Attempts to derive GitHub API/browser URL defaults from a Git remote URL
 * selected during installation.
 *
 * @param {string} remoteUrl - Git remote URL selected during installation.
 */
function tryDeriveGitHubUrlsFromRemoteUrl(remoteUrl) {
  try {
    return deriveGitHubUrlsFromRemoteUrl(remoteUrl);
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

function deriveGitHubUrlsFromRemoteUrl(remoteUrl) {
  if (typeof remoteUrl !== 'string' || !remoteUrl.trim()) {
    fail('Git remote URL is empty');
  }

  const url = remoteUrl.trim();

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

  fail('Git remote URL must point to a GitHub repository');
}

module.exports = {
  getCurrentConfiguredRemoteName,
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
  getCurrentRemoteConfiguration,
  getCurrentRepositoryUrlPath,
  tryDeriveGitHubUrlsFromRemoteUrl
};
