#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  assertExistingReadableWritableRegularFile,
} = require('../install/utils.cjs');

function currentWorkingDirectory() {
  return process.cwd();
}

/**
 * Checks that the process current working directory is the npm package root.
 *
 * The package root is supplied by the npm side of the installer pipeline. This
 * adapter crosses only the filesystem/process boundary.
 *
 * @remarks This assertion and code using it should eventually be replaced by 
 * direct uses of packageRoot to resolve paths more reliably, avoiding implicit
 * reliance on process cwd.      
 */
function assertCwdIsPackageRoot(packageRoot) {
  const resolvedCwd = path.resolve(currentWorkingDirectory());
  const resolvedPackageRoot = path.resolve(packageRoot);

  if (resolvedCwd !== resolvedPackageRoot) {
    throw new Error(
      `Install must be run from the npm package root.\n` +
      `Current working directory: ${resolvedCwd}\n` +
      `npm package root: ${resolvedPackageRoot}`
    );
  }
}

// Boundary-level requirement check used by installer phase logic.
// It delegates to the lower-level file check but throws in installation
// requirement terms.
function validateExistingPackageFile(packageFilePath) {
  try {
    assertExistingReadableWritableRegularFile(packageFilePath);
  } catch (error) {
    throw new Error(
      `${packageFilePath} must be an existing regular file readable and writable for Last of Readme to run`
    );
  }
}

// Secondary operational check (very unexpected failure)
function assertPackageFileReadyForPlaceholderInspection(packageFilePath) {
  try {
    assertExistingReadableWritableRegularFile(packageFilePath);
  } catch (error) {
    throw new Error(
      `Unexpected package-file access failure while inspecting the managed placeholder in ${packageFilePath}`
    );
  }
}

// TODO: The current check allows a parent path that exists but is a file,
// which later causes fs.mkdirSync to fail with a low-level EEXIST error.
// The installer should detect this earlier and report a clear, user-facing error:
// e.g. "package.json exists but is not a directory".
// This was pre-existing behavior and is intentionally preserved for now.
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

function packageFileExists(packageFilePath) {
  return fs.existsSync(packageFilePath);
}

function readPackageFileContent(packageFilePath) {
  return fs.readFileSync(packageFilePath, 'utf8');
}

function writePackageFileContent(packageFilePath, content) {
  fs.writeFileSync(packageFilePath, content);
}

function createPackageFileIfAbsent(packageFilePath, content) {
  const parentDir = path.dirname(packageFilePath);
  if (parentDir && parentDir !== '.') {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(packageFilePath, content, { flag: 'wx' });
}

module.exports = {
  currentWorkingDirectory,
  assertCwdIsPackageRoot,
  validateExistingPackageFile,
  assertPackageFileReadyForPlaceholderInspection,
  assertPackageFileCanBeCreated,
  packageFileExists,
  readPackageFileContent,
  writePackageFileContent,
  createPackageFileIfAbsent,
};
