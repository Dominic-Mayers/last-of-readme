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
 * Returns the remote name installed in package.json. Used for tag publication
 * by tag-doc.cjs and to determine the default in collectRemoteEnvironmentInput.
 */
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
 * Returns repository API/browser URLs needed in the resolver link.
 *
 * @remarks If there is eventually a need to tell the resolver what kind of API
 * is offered by the remote, then a kind value might be added. For now, the
 * resolver uses GitHub API endpoints.
 */
function remoteConfiguration() {
  return {
    repositoryApiUrl: String(getPackageJsonField('lastOfReadme.remote.repositoryApiUrl')),
    repositoryBrowserUrl: String(getPackageJsonField('lastOfReadme.remote.repositoryBrowserUrl')),
  };
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
  const value = getPackageJsonField('lastOfReadme.packageFilePath', { allowEmpty: true });
  if (!value || typeof value !== 'string') {
    fail('package.json has no lastOfReadme.packageFilePath');
  }
  return value;
}

/**
 * Returns the installed repository URL path used by update-readme-link.cjs when
 * no URL path is supplied on the command line.
 */
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
 * Reads the previously installed repository API URL for collectRemoteInput()
 * defaults.
 *
 * @remarks Requires no current installation; absence of Last of Readme remote
 * configuration is represented as an empty string.
 */
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

/**
 * Reads the previously installed repository browser URL for collectRemoteInput()
 * defaults.
 *
 * @remarks Requires no current installation; absence of Last of Readme remote
 * configuration is represented as an empty string.
 */
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

/**
 * Reads the previously installed repository URL path for
 * collectPackageFilePathInput() defaults.
 *
 * @remarks Requires no current installation; absence of Last of Readme package
 * configuration is represented as an empty string.
 */
function getCurrentRepositoryUrlPath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return '';
  }
  return typeof lastOfReadme.repositoryUrlPath === 'string'
    ? lastOfReadme.repositoryUrlPath
    : '';
}

/**
 * Attempts to derive GitHub API/browser URLs for collectRemoteInput() defaults.
 *
 * @param {string|{url?: string}} repository - package.json repository value or
 * @param {string} repositoryUrl - Git remote URL selected during installation.
 */
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
  tryDeriveGitHubRemoteUrls
};
