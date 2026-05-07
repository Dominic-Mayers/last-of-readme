#!/usr/bin/env node

/**
 * Adapter over npm configuration operations used by Last of Readme.
 *
 * @assertRequirement npm must be available and support `npm pkg` for reading and
 * writing configuration fields. Asserted in
 * assertPackageManifestReadableByNpm().
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runNpmPkg } = require('../runNpmPkg.cjs');

const WORKSPACE_ROOT = process.cwd();
const PACKAGE_PATH = path.join(WORKSPACE_ROOT, 'package.json');

/**
 * Asserts the basic npm configuration access needed by installer phases and
 * runtime scripts that read or write npm configuration.
 *
 * @returns {void}
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
 * Collects npm's package-root suggestion for
 * collectNpmPackageRootEnvironmentInput(), currently used by
 * checkCwdIsPackageRootRequirements().
 *
 * @todo Longer term, this package root should anchor direct resolution of
 * package-relative paths without relying on process cwd.
 * @todo In collectNpmPackageRootEnvironmentInput(), the value should be used as
 * a default in a user prompt and the user response should be authoritative.
 * @returns {string} npm's package-root path.
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
 * Returns the package version used by update-readme-link.cjs and tag-doc.cjs.
 *
 * @returns {string} Current package version.
 */
function currentPackageVersion() {
  return String(getPackageJsonField('version'));
}

/**
 * Returns the package name used by update-readme-link.cjs to identify the
 * package in resolver links.
 *
 * @returns {string} Current package name.
 */
function packageName() {
  return String(getPackageJsonField('name'));
}

/**
 * Returns the remote name used by tag-doc.cjs for tag publication.
 *
 * @configRequirement The Last of Readme remote name must be configured.
 * Configured in installRemotePackageJson().
 * @returns {string} Installed Git remote name.
 */
function configuredRemoteName() {
  const remoteName = getCurrentConfiguredRemoteName();

  if (!remoteName) {
    fail('No Last of Readme remoteName configured in package.json');
  }

  return remoteName;
}

/**
 * Reads the previously installed Git remote name used by
 * collectConfiguredRemoteNameEnvironmentInput() for remote-selection defaults.
 *
 * @returns {string} Installed Git remote name, or an empty string when absent.
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
 * Returns the documentation contract used by update-readme-link.cjs to build
 * resolver links.
 *
 * @configRequirement The Last of Readme documentation contract must be
 * configured before a version bump. Configured by
 * last-of-readme-contract.cjs.
 * @returns {string} Installed documentation contract.
 */
function configuredDocumentationContract() {
  const contract = getCurrentDocumentationContract();

  if (!contract) {
    fail('package.json has no lastOfReadme.contract');
  }

  return contract;
}

/**
 * Reads the previously selected documentation contract.
 *
 * @returns {string} Installed documentation contract, or an empty string when absent.
 */
function getCurrentDocumentationContract() {
  const contract = getPackageJsonField('lastOfReadme.contract', {
    allowEmpty: true,
  });

  return contract && typeof contract === 'string' ? contract : '';
}

/**
 * Returns repository API/browser URLs used by update-readme-link.cjs to build
 * the resolver link.
 *
 * @configRequirement The Last of Readme remote API/browser URLs must be
 * configured. Configured in installRemotePackageJson().
 * @todo Maybe, if there is eventually a need to tell the resolver what kind of
 * API is offered by the remote, then a kind value might be added. For now, the
 * resolver uses GitHub API endpoints.
 * @returns {{repositoryApiUrl: string, repositoryBrowserUrl: string}} Installed
 * remote repository URLs.
 */
function remoteConfiguration() {
  const remote = getCurrentRemoteConfiguration();

  if (!remote) {
    fail('package.json has no valid lastOfReadme.remote configuration');
  }

  return remote;
}

/**
 * Reads the previously installed repository API/browser URLs used by
 * collectRemoteInput() for remote-configuration defaults.
 *
 * @returns {{repositoryApiUrl: string, repositoryBrowserUrl: string} | null}
 * Installed remote repository URLs, or null when absent.
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
 * Returns the documentation package-file path used by update-readme-link.cjs
 * when no path is supplied on the command line.
 *
 * @configRequirement The Last of Readme package-file path must be configured.
 * Configured in installDocLinkPackageJson().
 * @returns {string} Installed documentation package-file path.
 */
function packageFilePath() {
  const value = getCurrentInstalledPackageFilePath();

  if (!value) {
    fail('package.json has no lastOfReadme.packageFilePath');
  }

  return value;
}

/**
 * Reads the previously installed package-file path used by
 * collectPackageFilePathInput() for package-file defaults.
 *
 * @returns {string | null} Installed package-file path, or null when absent.
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
 * Returns the repository URL path used by update-readme-link.cjs when no URL
 * path is supplied on the command line.
 *
 * @configRequirement The Last of Readme repository URL path must be configured.
 * Configured in installDocLinkPackageJson().
 * @returns {string} Installed repository URL path.
 */
function repositoryUrlPath() {
  const value = getCurrentRepositoryUrlPath();

  if (value === null) {
    fail('package.json has no valid lastOfReadme.repositoryUrlPath');
  }

  return value;
}

/**
 * Reads the previously installed repository URL path used by
 * collectPackageFilePathInput() for repository-url-path defaults.
 *
 * @returns {string | null} Installed repository URL path, or null when absent.
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
 * Reads the current npm files field used by collectPackageFilePathInput() and
 * apply-installation for package-file publication hygiene.
 *
 * @returns {string[] | null} Current files array, or null when absent or not an
 * array.
 */
function getCurrentFilesField() {
  const files = getPackageJsonField('files', { allowEmpty: true });
  return Array.isArray(files) ? files : null;
}

/**
 * Writes npm configuration fields during apply-installation.
 *
 * @param {Record<string, unknown>} updates - npm pkg set assignments keyed by
 * configuration field path.
 * @returns {void}
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
    assertPackageManifestReadableByNpm,
    npmPackageRoot,
    currentPackageVersion,
    packageName,
    configuredRemoteName,
    getCurrentConfiguredRemoteName,
    configuredDocumentationContract,
    getCurrentDocumentationContract,
    remoteConfiguration,
    getCurrentRemoteConfiguration,
    packageFilePath,
    getCurrentInstalledPackageFilePath,
    repositoryUrlPath,
    getCurrentRepositoryUrlPath,
    getCurrentFilesField,
    updatePackageJsonFields
};


