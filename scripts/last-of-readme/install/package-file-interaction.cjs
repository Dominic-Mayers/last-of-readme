#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { normalizePackageFilePath } = require('./utils.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function validatePackageFilePath(packageFilePath) {
  if (
    packageFilePath === '.' ||
    packageFilePath === '..' ||
    packageFilePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(packageFilePath)
  ) {
    throw new Error(
      'packageFilePath must point to a file inside the current repository'
    );
  }
}

function validateExistingPackageFile(packageFilePath) {
  const stats = fs.statSync(packageFilePath);

  if (!stats.isFile()) {
    throw new Error(`${packageFilePath} exists but is not a regular file`);
  }

  fs.accessSync(packageFilePath, fs.constants.R_OK | fs.constants.W_OK);
}

function validateWritableBaseDirectoryForNewFile(packageFilePath) {
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

function collectPackageFilePathEnvironmentInput(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);

  return {
    ...config,
    _packageFilePathEnvironmentInput: {
      packageFileExistsAnswer: fs.existsSync(packageFilePath),
    },
  };
}

function cleanPackageFilePathEnvironmentInput(config = {}) {
  const environmentInput = config._packageFilePathEnvironmentInput || {};

  return {
    ...config,
    _packageFilePathEnvironmentInput: {
      packageFileExists: Boolean(environmentInput.packageFileExistsAnswer),
    },
  };
}

function checkPackageFilePathRequirements(config = {}) {
  const input = config.docLink || {};
  const environmentInput = config._packageFilePathEnvironmentInput || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);

  validatePackageFilePath(packageFilePath);

  if (environmentInput.packageFileExists) {
    validateExistingPackageFile(packageFilePath);
  }

  return config;
}

function normalizePackageFilePathInput(config = {}) {
  const input = config.docLink || {};
  const environmentInput = config._packageFilePathEnvironmentInput || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);

  const { _packageFilePathEnvironmentInput, ...configWithoutEnvironmentInput } =
    config;
  const {
    packageFilePathAnswer,
    repositoryUrlPathAnswer,
    ...docLinkWithoutRawAnswers
  } = input;

  return {
    ...configWithoutEnvironmentInput,
    docLink: {
      ...docLinkWithoutRawAnswers,
      packageFilePath,
      packageFileExists: Boolean(environmentInput.packageFileExists),
    },
  };
}

function findManagedPlaceholder(content) {
  let searchOffset = 0;

  while (searchOffset <= content.length) {
    const placeholderStart = content.indexOf(START_MARKER, searchOffset);

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

    const exampleStart = content.indexOf(EXAMPLE_START_MARKER, searchOffset);

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

    if (placeholderStart >= exampleStart && placeholderStart < exampleEnd) {
      searchOffset = exampleEnd;
      continue;
    }

    return {
      start: placeholderStart,
      end: placeholderEnd,
    };
  }

  return null;
}

function validateExistingDocLinkFile(packageFilePath) {
  validateExistingPackageFile(packageFilePath);

  const content = fs.readFileSync(packageFilePath, 'utf8');
  const managedPlaceholder = findManagedPlaceholder(content);

  if (!managedPlaceholder) {
    throw new Error(
      `${packageFilePath} does not contain a managed placeholder outside example regions`
    );
  }

  return {
    managedPlaceholder,
  };
}

function checkDocLinkPlaceholderRequirements(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);

  validatePackageFilePath(packageFilePath);

  if (!input.packageFileExists) {
    if (!input.shouldCreateMinimalFile) {
      throw new Error(
        `${packageFilePath} does not exist. Select minimal-file creation or create the file with the placeholder to allow installation.`
      );
    }

    validateWritableBaseDirectoryForNewFile(packageFilePath);

    return {
      ...config,
      _docLinkPlaceholderCheck: {
        mode: 'create-minimal-file',
      },
    };
  }

  const validation = validateExistingDocLinkFile(packageFilePath);

  return {
    ...config,
    _docLinkPlaceholderCheck: {
      mode: 'existing-file',
      managedPlaceholder: validation.managedPlaceholder,
    },
  };
}

function normalizeDocLinkPlaceholderInput(config = {}) {
  const checkResult = config._docLinkPlaceholderCheck || {};
  const { _docLinkPlaceholderCheck, ...configWithoutCheck } = config;

  return {
    ...configWithoutCheck,
    docLink: {
      ...(configWithoutCheck.docLink || {}),
      mode: checkResult.mode,
      managedPlaceholder: checkResult.managedPlaceholder,
    },
  };
}

module.exports = {
  START_MARKER,
  END_MARKER,
  EXAMPLE_START_MARKER,
  EXAMPLE_END_MARKER,
  validatePackageFilePath,
  validateExistingPackageFile,
  validateWritableBaseDirectoryForNewFile,
  collectPackageFilePathEnvironmentInput,
  cleanPackageFilePathEnvironmentInput,
  findManagedPlaceholder,
  validateExistingDocLinkFile,
  checkPackageFilePathRequirements,
  normalizePackageFilePathInput,
  checkDocLinkPlaceholderRequirements,
  normalizeDocLinkPlaceholderInput,
};
