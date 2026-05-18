#!/usr/bin/env node

/**
 * Adapter over filesystem and process-current-directory operations used by
 * Last of Readme installer phases and core scripts.
 *
 * File-level requirements apply to exported functions and are not repeated in
 * individual JSDoc blocks.
 */

const fs = require('fs');
const path = require('path');
const {
  assertExistingReadableWritableRegularFile,
} = require('../install/utils.cjs');

/**
 * Assert that the installer is running from the npm package root.
 *
 * This supports checkCwdIsPackageRootRequirements(), because later filesystem
 * steps still resolve package-file paths from process cwd.
 *
 * @param {string} packageRoot - The npm package root collected by the npm side
 * of the installer pipeline.
 * @returns {void}
 *
 * @remarks This is an assertion for the installer runtime, not an installation
 * requirement for the installed runtime code. TODO: The installer should
 * eventually use packageRoot directly when resolving paths, instead of
 * relying on process cwd after this assertion has run.
 */
function assertCwdIsPackageRoot(packageRoot) {
  const resolvedCwd = path.resolve(process.cwd());
  const resolvedPackageRoot = path.resolve(packageRoot);

  if (resolvedCwd !== resolvedPackageRoot) {
    throw new Error(
      `Install must be run from the npm package root.\n` +
      `Current working directory: ${resolvedCwd}\n` +
      `npm package root: ${resolvedPackageRoot}`
    );
  }
}

/**
 * Assert that an existing package documentation file selected by the installer
 * is a regular file that Last of Readme can read and write.
 *
 * This supplies the filesystem requirement check used by
 * checkPackageFilePathRequirements() and checkLinkPlaceholderRequirements()
 * before the installer reads or rewrites the selected file.
 *
 * @param {string} packageFilePath - Package documentation file path selected
 * for Last of Readme management.
 * @returns {void}
 */
function validateExistingPackageFile(packageFilePath) {
  try {
    assertExistingReadableWritableRegularFile(packageFilePath);
  } catch (error) {
    throw new Error(
      `${packageFilePath} must be an existing regular file readable and writable for Last of Readme to run`
    );
  }
}

/**
 * Assert that the selected location can support creation of a missing package
 * documentation file.
 *
 * This supplies the filesystem requirement check used by
 * checkLinkPlaceholderRequirements() before createDocLinkFileIfNeeded() creates
 * a minimal package documentation file.
 *
 * @param {string} packageFilePath - Package documentation file path selected
 * for minimal-file creation.
 * @returns {void}
 *
 * @remarks TODO: The current check allows a parent path that exists but is a
 * file, which later causes fs.mkdirSync to fail with a low-level EEXIST error.
 * The installer should detect this earlier and report a clear, user-facing
 * error.
 */
function assertPackageFileCanBeCreated(packageFilePath) {
  let candidateDirectory = path.dirname(packageFilePath);

  while (
    candidateDirectory &&
    candidateDirectory !== '.' &&
    !fs.existsSync(candidateDirectory)
  ) {
    const parentDirectory = path.dirname(candidateDirectory);

    if (parentDirectory === candidateDirectory) {
      break;
    }

    candidateDirectory = parentDirectory;
  }

  if (candidateDirectory && candidateDirectory !== '.') {
    fs.accessSync(candidateDirectory, fs.constants.W_OK);
  }
}

/**
 * Report whether the package documentation file selected by the installer or
 * core updater currently exists.
 *
 * This supplies the filesystem observation used by
 * collectPackageFilePathEnvironmentInput() and by core updater logic that
 * decides whether a managed file is available.
 *
 * @param {string} packageFilePath - Package documentation file path selected
 * for Last of Readme management.
 * @returns {boolean} True when the path exists.
 */
function packageFileExists(packageFilePath) {
  return fs.existsSync(packageFilePath);
}

/**
 * Read the package documentation file managed by Last of Readme.
 *
 * During installation, this supplies file content to
 * collectDocLinkPlaceholderEnvironmentInput(). At runtime, it supplies file
 * content to the core updater before the managed block is replaced.
 *
 * @param {string} packageFilePath - Package documentation file path to read.
 * @returns {string} UTF-8 file content.
 *
 * @remarks Runtime callers rely on the path being readable when this function
 * is executed.
 */
function readPackageFileContent(packageFilePath) {
  return fs.readFileSync(packageFilePath, 'utf8');
}

/**
 * Write updated content to the package documentation file managed by Last of
 * Readme.
 *
 * This is used by the core updater after it has built the replacement managed
 * block.
 *
 * @param {string} packageFilePath - Package documentation file path to write.
 * @param {string} content - Complete file content to write.
 * @returns {void}
 *
 * @remarks Runtime callers rely on the path being writable when this function
 * is executed.
 */
function writePackageFileContent(packageFilePath, content) {
  fs.writeFileSync(packageFilePath, content);
}

/**
 * Create the selected package documentation file with minimal Last of Readme
 * content for createDocLinkFileIfNeeded() when the installer selected
 * minimal-file creation.
 *
 * @param {string} packageFilePath - Package documentation file path to create.
 * @param {string} content - Initial file content.
 * @returns {void}
 *
 * @remarks Uses exclusive file creation and fails if the file appears between
 * the installer check and installation-per-se.
 */
function createPackageFileIfAbsent(packageFilePath, content) {
  const parentDir = path.dirname(packageFilePath);
  if (parentDir && parentDir !== '.') {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(packageFilePath, content, { flag: 'wx' });
}

module.exports = {
    assertCwdIsPackageRoot,
    validateExistingPackageFile,
    assertPackageFileCanBeCreated,
    packageFileExists,
    readPackageFileContent,
    writePackageFileContent,
    createPackageFileIfAbsent,
};
