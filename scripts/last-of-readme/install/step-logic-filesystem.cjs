#!/usr/bin/env node

const path = require('path');
const { normalizePackageFilePath } = require('./utils.cjs');

const {
  assertCwdIsPackageRoot,
  validateExistingPackageFile,
  assertPackageFileReadyForPlaceholderInspection,
  assertPackageFileCanBeCreated,
  packageFileExists,
  readPackageFileContent,
} = require('../adapters/filesystem-adapter.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function prepareCwdPackageRootEnvironmentInput(config = {}) {
  const environmentInput = config._cwdPackageRootEnvironmentInput || {};

  return {
    ...config,
    _cwdPackageRootEnvironmentInput: {
      npmPackageRoot: path.resolve(
        String(environmentInput.npmPackageRootAnswer || '')
      ),
    },
  };
}

function checkCwdPackageRootRequirements(config = {}) {
  const environmentInput = config._cwdPackageRootEnvironmentInput || {};

  assertCwdIsPackageRoot(environmentInput.npmPackageRoot);

  return config;
}

function finalizeCwdPackageRootState(config = {}) {
  const { _cwdPackageRootEnvironmentInput, ...configWithoutEnvironmentInput } =
    config;

  return configWithoutEnvironmentInput;
}

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

function collectPackageFilePathEnvironmentInput(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = input.packageFilePath;

  return {
    ...config,
    _packageFilePathEnvironmentInput: {
      packageFileExistsAnswer: packageFileExists(packageFilePath),
    },
  };
}

function preparePackageFilePathEnvironmentInput(config = {}) {
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
  const packageFilePath = input.packageFilePath;

  validatePackageFilePath(packageFilePath);

  if (environmentInput.packageFileExists) {
    validateExistingPackageFile(packageFilePath);
  }

  return config;
}

function finalizePackageFilePathState(config = {}) {
  const input = config.docLink || {};
  const environmentInput = config._packageFilePathEnvironmentInput || {};
  const packageFilePath = input.packageFilePath;

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
  assertPackageFileReadyForPlaceholderInspection(packageFilePath);

  const content = readPackageFileContent(packageFilePath);
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

function collectDocLinkPlaceholderEnvironmentInput(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);

  if (!input.packageFileExists) {
    return {
      ...config,
      _docLinkPlaceholderEnvironmentInput: {},
    };
  }

  const content = readPackageFileContent(packageFilePath);

  return {
    ...config,
    _docLinkPlaceholderEnvironmentInput: {
      content,
    },
  };
}

function prepareDocLinkPlaceholderEnvironmentInput(config = {}) {
  const environmentInput = config._docLinkPlaceholderEnvironmentInput || {};
  const managedPlaceholder = environmentInput.content
    ? findManagedPlaceholder(environmentInput.content)
    : null;

  return {
    ...config,
    _docLinkPlaceholderEnvironmentInput: {
      ...environmentInput,
      managedPlaceholder,
    },
  };
}

function checkDocLinkPlaceholderRequirements(config = {}) {
  const input = config.docLink || {};
  const environmentInput = config._docLinkPlaceholderEnvironmentInput || {};
  const packageFilePath = normalizePackageFilePath(input.packageFilePath);

  validatePackageFilePath(packageFilePath);

  if (!input.packageFileExists) {
    if (!input.shouldCreateMinimalFile) {
      throw new Error(
        `${packageFilePath} does not exist. Select minimal-file creation or create the file with the placeholder to allow installation.`
      );
    }

    assertPackageFileCanBeCreated(packageFilePath);

    return {
      ...config,
      _docLinkPlaceholderCheck: {
        mode: 'create-minimal-file',
      },
    };
  }

  validateExistingPackageFile(packageFilePath);

  if (!environmentInput.managedPlaceholder) {
    throw new Error(
      `${packageFilePath} does not contain a managed placeholder outside example regions`
    );
  }

  return {
    ...config,
    _docLinkPlaceholderCheck: {
      mode: 'existing-file',
      managedPlaceholder: environmentInput.managedPlaceholder,
    },
  };
}

function finalizeDocLinkPlaceholderState(config = {}) {
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
  prepareCwdPackageRootEnvironmentInput,
  checkCwdPackageRootRequirements,
  finalizeCwdPackageRootState,
  validatePackageFilePath,
  validateWritableBaseDirectoryForNewFile: assertPackageFileCanBeCreated,
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  findManagedPlaceholder,
  validateExistingDocLinkFile,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
  collectDocLinkPlaceholderEnvironmentInput,
  prepareDocLinkPlaceholderEnvironmentInput,
  checkDocLinkPlaceholderRequirements,
  finalizeDocLinkPlaceholderState,
};
