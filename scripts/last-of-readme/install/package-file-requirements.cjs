#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { normalizePackageFilePath } = require('./collect-user-input.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function checkDocLinkRequirements(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);
  checkPackageFilePathRequirements(packageFilePath);
  const shouldCreateMinimalFile = Boolean(input.shouldCreateMinimalFile);
  const removePreviousPackageFileFromFiles = Boolean(
    input.removePreviousPackageFileFromFiles
  );
  const previousPackageFilePath =
    typeof input.previousPackageFilePath === 'string' ? input.previousPackageFilePath : null;

  if (fs.existsSync(packageFilePath)) {
    const validation = validateExistingDocLinkFile(packageFilePath);
    return {
      ...config,
      docLink: {
        ...(config.docLink || {}),
        packageFilePath,
        previousPackageFilePath,
        mode: validation.mode,
        shouldCreateMinimalFile,
        removePreviousPackageFileFromFiles,
      },
    };
  }

  if (!shouldCreateMinimalFile) {
    throw new Error(
      `${packageFilePath} does not exist. Select minimal-file creation or create the file with the placeholder to allow installation.`
    );
  }

  let writableBaseDir = path.dirname(packageFilePath);
  while (writableBaseDir && writableBaseDir !== '.' && !fs.existsSync(writableBaseDir)) {
    const next = path.dirname(writableBaseDir);
    if (next === writableBaseDir) {
      break;
    }
    writableBaseDir = next;
  }

  if (writableBaseDir && writableBaseDir !== '.') {
    fs.accessSync(writableBaseDir, fs.constants.W_OK);
  }

  return {
    ...config,
    docLink: {
      ...(config.docLink || {}),
      packageFilePath,
      previousPackageFilePath,
      mode: 'create-minimal-file',
      shouldCreateMinimalFile,
      removePreviousPackageFileFromFiles,
    },
  };
}

function checkPackageFilePathRequirements(packageFilePath) {
  if (
    packageFilePath === '.' ||
    packageFilePath === '..' ||
    packageFilePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(packageFilePath)
  ) {
    throw new Error('packageFilePath must point to a file inside the current repository');
  }
}

function validateExistingDocLinkFile(packageFilePath) {
  const stats = fs.statSync(packageFilePath);
  if (!stats.isFile()) {
    throw new Error(`${packageFilePath} exists but is not a regular file`);
  }

  fs.accessSync(packageFilePath, fs.constants.R_OK | fs.constants.W_OK);

  const content = fs.readFileSync(packageFilePath, 'utf8');
  const managedPlaceholder = findManagedPlaceholder(content);

  if (!managedPlaceholder) {
    throw new Error(
      `${packageFilePath} does not contain a managed placeholder outside example regions`
    );
  }

  return {
    mode: 'existing-file',
    managedPlaceholder,
  };
}

function findManagedPlaceholder(content) {
  let offset = 0;

  while (offset <= content.length) {
    const placeholderStart = content.indexOf(START_MARKER, offset);
    if (placeholderStart === -1) {
      return null;
    }

    const placeholderEndMarkerStart = content.indexOf(
      END_MARKER,
      placeholderStart + START_MARKER.length
    );
    if (placeholderEndMarkerStart === -1) {
      throw new Error('Unclosed placeholder block');
    }

    const placeholderEnd = placeholderEndMarkerStart + END_MARKER.length;

    const exampleStart = content.indexOf(EXAMPLE_START_MARKER, offset);
    if (exampleStart === -1) {
      return {
        start: placeholderStart,
        end: placeholderEnd,
      };
    }

    const exampleEndMarkerStart = content.indexOf(
      EXAMPLE_END_MARKER,
      exampleStart + EXAMPLE_START_MARKER.length
    );
    if (exampleEndMarkerStart === -1) {
      throw new Error('Unclosed example region');
    }

    const exampleEnd = exampleEndMarkerStart + EXAMPLE_END_MARKER.length;

    if (placeholderEnd <= exampleStart) {
      return {
        start: placeholderStart,
        end: placeholderEnd,
      };
    }

    offset = exampleEnd;
  }

  return null;
}

module.exports = {
  START_MARKER,
  END_MARKER,
  EXAMPLE_START_MARKER,
  EXAMPLE_END_MARKER,
  findManagedPlaceholder,
  checkPackageFilePathRequirements,
  checkDocLinkRequirements,
  validateExistingDocLinkFile,
};
