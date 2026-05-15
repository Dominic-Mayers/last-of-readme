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
 * Returns the configured remoteName value used by tag-doc.cjs for tag publication.
 *
 * @configRequirement The Last of Readme remoteName value must be configured.
 * Configured in installRemoteConfigFields().
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
 * Reads the previously installed remoteName value used by
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
 * Returns the configured nextContract value used by update-readme-link.cjs to
 * build resolver links.
 *
 * @remarks The next documentation contract must be set before each version bump
 * by running `last-of-readme contract <name>`. This is a runtime workflow
 * requirement, not an installation requirement.
 * @returns {string} Installed next documentation contract.
 */
function configuredNextDocumentationContract() {
  const contract = getCurrentNextDocumentationContract();

  if (!contract) {
    fail('package.json has no lastOfReadme.nextContract');
  }

  return contract;
}

/**
 * Reads the previously selected next documentation contract.
 *
 * @returns {string} Installed next documentation contract, or an empty string when absent.
 */
function getCurrentNextDocumentationContract() {
  const contract = getPackageJsonField('lastOfReadme.nextContract', {
    allowEmpty: true,
  });

  return contract && typeof contract === 'string' ? contract : '';
}

/**
 * Returns the repositoryApiUrl and repositoryBrowserUrl values used by
 * update-readme-link.cjs to build the resolver link.
 *
 * @configRequirement The Last of Readme repositoryApiUrl and repositoryBrowserUrl values must be
 * configured. Configured in installRemoteConfigFields().
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
 * Reads the previously installed repositoryApiUrl and repositoryBrowserUrl
 * values used by collectRemoteInput() for URL defaults.
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
 * Configured in installDocLinkConfigFields().
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
 * Configured in installDocLinkConfigFields().
 * @returns {string} Installed repositoryUrlPath value.
 */
function repositoryUrlPath() {
  const value = getCurrentRepositoryUrlPath();

  if (value === null) {
    fail('package.json has no valid lastOfReadme.repositoryUrlPath');
  }

  return value;
}

/**
 * Reads the previously installed repositoryUrlPath value used by
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
 * Writes npm configuration fields for installation-per-se step functions such
 * as installRemoteConfigFields() and installDocLinkConfigFields().
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

function updateFilesField(
  currentFiles,
  packageFilePath,
  previousPackageFilePath,
  shouldRemovePrevious
) {
  if (!Array.isArray(currentFiles)) {
    return null;
  }

  const updatedFiles = [...currentFiles];

  if (!updatedFiles.includes(packageFilePath)) {
    updatedFiles.push(packageFilePath);
  }

  if (
    shouldRemovePrevious &&
    typeof previousPackageFilePath === 'string' &&
    previousPackageFilePath !== packageFilePath
  ) {
    return updatedFiles.filter((item) => item !== previousPackageFilePath);
  }

  return updatedFiles;
}

/**
 * Writes the Last of Readme remote configuration to package.json for
 * installRemoteConfigFields().
 *
 * @param {object} params
 * @param {string} params.remoteName - Git remote name used at runtime for
 * documentation-tag publication.
 * @param {object} params.remote - Values embedded in resolver links so the
 * browser resolver can query and open the remote repository.
 * @param {string} params.remote.kind - Remote repository adapter kind.
 * @param {string} params.remote.repositoryApiUrl - GitHub API endpoint used by
 * the resolver to query tags, branches, and comparisons.
 * @param {string} params.remote.repositoryBrowserUrl - Browser URL used by the
 * resolver to open documentation at the resolved tag or branch.
 * @returns {void}
 */
function writeRemoteConfig({ remoteName, remote }) {
  updatePackageJsonFields({
    'lastOfReadme.remoteName': remoteName,
    'lastOfReadme.remote.kind': remote.kind,
    'lastOfReadme.remote.repositoryApiUrl': remote.repositoryApiUrl,
    'lastOfReadme.remote.repositoryBrowserUrl': remote.repositoryBrowserUrl,
  });
}

/**
 * Writes the packageFilePath and repositoryUrlPath values to package.json, and
 * ensures that file is listed in the npm files field. Called by
 * installDocLinkConfigFields().
 *
 * The files-field update also applies the decision to remove a previous
 * package file from the npm files field, collected earlier by
 * collectPackageFilePathInput().
 *
 * @param {object} params
 * @param {string} params.packageFilePath - Package documentation file path that
 * update-readme-link.cjs reads and rewrites.
 * @param {string | undefined} params.repositoryUrlPath - Repository-relative
 * documentation path embedded in generated resolver links.
 * @param {string | undefined} params.previousPackageFilePath - Previously
 * installed package documentation file path, if any.
 * @param {boolean} params.removePreviousPackageFileFromFiles - Whether the
 * previous package documentation file should be removed from the npm files field.
 * @returns {void}
 */
function writeDocLinkConfig({
  packageFilePath,
  repositoryUrlPath,
  previousPackageFilePath,
  removePreviousPackageFileFromFiles,
}) {
  updatePackageJsonFields({
    'lastOfReadme.packageFilePath': packageFilePath,
    ...(typeof repositoryUrlPath === 'string'
      ? { 'lastOfReadme.repositoryUrlPath': repositoryUrlPath }
      : {}),
  });

  const currentFiles = getCurrentFilesField();
  const updatedFiles = updateFilesField(
    currentFiles,
    packageFilePath,
    previousPackageFilePath,
    Boolean(removePreviousPackageFileFromFiles)
  );

  if (updatedFiles !== null) {
    updatePackageJsonFields({ files: updatedFiles });
  }
}

/**
 * Writes the default nonInteractiveFailurePolicy to package.json if it is
 * not already set, as requested by installNonInteractivePolicyField().
 *
 * @returns {void}
 */
function writeNonInteractivePolicyIfAbsent() {
  const currentConfig = getLastOfReadmeConfig();

  if (currentConfig.nonInteractiveFailurePolicy !== undefined) {
    return;
  }

  updatePackageJsonFields({
    'lastOfReadme.nonInteractiveFailurePolicy': 'continue',
  });
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


/**
 * Reads the preversion, version, and postversion scripts hooks used by
 * getExistingInstallationFingerprint() to detect an existing
 * Last of Readme installation.
 *
 * @returns {{ preversion: string, version: string, postversion: string }}
 * Current scripts hooks, each as an empty string when absent.
 */
function getCurrentScriptsHooks() {
  const hooks = {};
  for (const hook of ['preversion', 'version', 'postversion']) {
    const value = getPackageJsonField(`scripts.${hook}`, { allowEmpty: true });
    hooks[hook] = typeof value === 'string' ? value : '';
  }
  return hooks;
}

/**
 * Detects an existing Last of Readme installation fingerprint in package.json.
 *
 * The result is used by collectExistingInstallationEnvironmentInput() before
 * checkInstallationPreconditionsRequirements() asks the user for consent.
 *
 * An installation is detected when:
 * - The lastOfReadme field is present, or
 * - Any of preversion, version, or postversion contains a reference to
 *   the last-of-readme bin command.
 *
 * @returns {{ hasLastOfReadmeField: boolean, hooksWithInstallation: string[] } | null}
 */
function getExistingInstallationFingerprint() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  const hasLastOfReadmeField =
    lastOfReadme !== null &&
    lastOfReadme !== undefined &&
    lastOfReadme !== '' &&
    typeof lastOfReadme === 'object';

  const hooks = getCurrentScriptsHooks();
  const hooksWithInstallation = Object.entries(hooks)
    .filter(([, value]) => value.includes('last-of-readme'))
    .map(([key]) => key);

  if (!hasLastOfReadmeField && hooksWithInstallation.length === 0) {
    return null;
  }

  return { hasLastOfReadmeField, hooksWithInstallation };
}


/**
 * Returns the full lastOfReadme configuration object used by attempt-utils.cjs
 * to read the nonInteractiveFailurePolicy.
 *
 * @returns {object} The lastOfReadme config object, or an empty object when absent.
 */
function getLastOfReadmeConfig() {
  const value = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  return value && typeof value === 'object' ? value : {};
}


/**
 * Reads the npm script hook as needed for installing a Last of Readme-owned
 * hook command. Used by collectLastOfReadmeOwnedVersionHooksEnvironmentInput()
 * before the user-input step chooses how each hook should be installed.
 *
 * @param {object} params
 * @param {string} params.hook - npm lifecycle hook to inspect.
 * @param {string} params.command - Last of Readme-owned command to preserve,
 * replace, or install in that hook.
 * @returns {{ hook: string, command: string, rawContent: string, remainingContent: string }}
 */
function getLastOfReadmeOwnedHookInstallationState({ hook, command }) {
  const rawContent = getPackageJsonField(`scripts.${hook}`, {
    allowEmpty: true,
  });
  const normalizedRawContent =
    typeof rawContent === 'string' ? rawContent : '';

  return {
    hook,
    command,
    rawContent: normalizedRawContent,
    remainingContent: stripLastOfReadmeOwnedHookCommand(
      normalizedRawContent,
      command
    ),
  };
}

/**
 * Installs a Last of Readme-owned command in an npm script hook for
 * installLastOfReadmeOwnedVersionHookCommands().
 *
 * @param {object} params
 * @param {string} params.hook - npm lifecycle hook to update.
 * @param {string} params.command - Last of Readme-owned command to install.
 * @param {string} [params.remainingContent] - Existing user-owned hook content
 * that should run after the installed Last of Readme command.
 * @returns {void}
 */
function installLastOfReadmeOwnedHookCommand({ hook, command, remainingContent = '' }) {
  const nextContent = remainingContent
    ? `${command} && ${remainingContent}`
    : command;
  updatePackageJsonFields({ [`scripts.${hook}`]: nextContent });
}

function stripLastOfReadmeOwnedHookCommand(hookContent, ownedCommand) {
  if (!hookContent) return '';
  return hookContent
    .replace(new RegExp(`\\s*&&\\s*${escapeRegExp(ownedCommand)}`, 'g'), '')
    .replace(new RegExp(`${escapeRegExp(ownedCommand)}\\s*&&\\s*`, 'g'), '')
    .replace(new RegExp(`^${escapeRegExp(ownedCommand)}$`), '')
    .trim();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    assertPackageManifestReadableByNpm,
    npmPackageRoot,
    currentPackageVersion,
    packageName,
    configuredRemoteName,
    getCurrentConfiguredRemoteName,
    configuredNextDocumentationContract,
    getCurrentNextDocumentationContract,
    remoteConfiguration,
    getCurrentRemoteConfiguration,
    packageFilePath,
    getCurrentInstalledPackageFilePath,
    repositoryUrlPath,
    getCurrentRepositoryUrlPath,
    getCurrentFilesField,
    updatePackageJsonFields,
    writeRemoteConfig,
    writeDocLinkConfig,
    writeNonInteractivePolicyIfAbsent,
    getCurrentScriptsHooks,
    getExistingInstallationFingerprint,
    getLastOfReadmeConfig,
    getLastOfReadmeOwnedHookInstallationState,
    installLastOfReadmeOwnedHookCommand,
};


