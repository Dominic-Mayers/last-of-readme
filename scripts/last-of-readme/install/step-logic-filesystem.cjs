#!/usr/bin/env node

const path = require('path');
const { normalizePackageFilePath } = require('./utils.cjs');

const {
  assertCwdIsPackageRoot,
  validateExistingPackageFile,
  assertPackageFileCanBeCreated,
  packageFileExists,
  readPackageFileContent,
  createPackageFileIfAbsent,
} = require('../driven-adapters/filesystem-adapter.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function prepareCwdPackageRootEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};

  return {
    ...pipelineState,
    control: {
      ...control,
      npmPackageRoot: path.resolve(
        String(control.npmPackageRootAnswer || '')
      ),
    },
  };
}

function checkCwdIsPackageRootRequirements(pipelineState = {}) {
  const control = pipelineState.control || {};

  assertCwdIsPackageRoot(control.npmPackageRoot);

  return pipelineState;
}

function finalizeCwdPackageRootState(pipelineState = {}) {
  const {
    npmPackageRootAnswer,
    npmPackageRoot,
    ...controlWithoutCwdPackageRoot
  } = pipelineState.control || {};

  return {
    ...pipelineState,
    control: controlWithoutCwdPackageRoot,
  };
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

function collectPackageFilePathEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const packageFilePath = pipelineState.config?.packageFilePath;

  return {
    ...pipelineState,
    control: {
      ...control,
      packageFileExistsAnswer: packageFileExists(packageFilePath),
    },
  };
}

function preparePackageFilePathEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};

  return {
    ...pipelineState,
    control: {
      ...control,
      packageFileExists: Boolean(control.packageFileExistsAnswer),
    },
  };
}

function checkPackageFilePathRequirements(pipelineState = {}) {
  const control = pipelineState.control || {};
  const packageFilePath = pipelineState.config?.packageFilePath;

  validatePackageFilePath(packageFilePath);

  if (control.packageFileExists) {
    validateExistingPackageFile(packageFilePath);
  }

  return pipelineState;
}

function finalizePackageFilePathState(pipelineState = {}) {
  const {
    packageFileExistsAnswer,
    packageFilePathAnswer,
    repositoryUrlPathAnswer,
    defaultPackageFilePath,
    defaultRepositoryUrlPath,
    ...controlWithoutRawPackageFileInput
  } = pipelineState.control || {};

  return {
    ...pipelineState,
    control: {
      ...controlWithoutRawPackageFileInput,
      packageFileExists: Boolean(pipelineState.control?.packageFileExists),
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

function collectDocLinkPlaceholderEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const packageFilePath = normalizePackageFilePath(
    pipelineState.config?.packageFilePath
  );

  if (!control.packageFileExists) {
    return pipelineState;
  }

  return {
    ...pipelineState,
    control: {
      ...control,
      packageFileContent: readPackageFileContent(packageFilePath),
    },
  };
}

function prepareDocLinkPlaceholderEnvironmentInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const managedPlaceholder = control.packageFileContent
    ? findManagedPlaceholder(control.packageFileContent)
    : null;

  return {
    ...pipelineState,
    control: {
      ...control,
      managedPlaceholder,
    },
  };
}

function checkLinkPlaceholderRequirements(pipelineState = {}) {
  const control = pipelineState.control || {};
  const packageFilePath = normalizePackageFilePath(
    pipelineState.config?.packageFilePath
  );

  validatePackageFilePath(packageFilePath);

  if (!control.packageFileExists) {
    if (!control.shouldCreateMinimalFile) {
      throw new Error(
        `${packageFilePath} does not exist. Select minimal-file creation or create the file with the placeholder to allow installation.`
      );
    }

    assertPackageFileCanBeCreated(packageFilePath);

    return {
      ...pipelineState,
      control: {
        ...control,
        mode: 'create-minimal-file',
      },
    };
  }

  validateExistingPackageFile(packageFilePath);

  if (!control.managedPlaceholder) {
    throw new Error(
      `${packageFilePath} does not contain a managed placeholder outside example regions`
    );
  }

  return {
    ...pipelineState,
    control: {
      ...control,
      mode: 'existing-file',
    },
  };
}

function finalizeDocLinkPlaceholderState(pipelineState = {}) {
  const {
    packageFileContent,
    packageFileExistsAnswer,
    managedPlaceholder,
    mode,
    ...controlWithoutPlaceholderInput
  } = pipelineState.control || {};

  return {
    ...pipelineState,
    control: {
      ...controlWithoutPlaceholderInput,
      mode,
      ...(managedPlaceholder ? { managedPlaceholder } : {}),
    },
  };
}


function createDocLinkFileIfNeeded(pipelineState = {}) {
  if ((pipelineState.control || {}).mode !== 'create-minimal-file') {
    return pipelineState;
  }
  const packageFilePath = normalizePackageFilePath(pipelineState.config?.packageFilePath);
  createPackageFileIfAbsent(packageFilePath, `Last of Readme : ${START_MARKER}${END_MARKER}\n`);
  return pipelineState;
}

function finalizeDocLinkFileInstallationState(pipelineState = {}) {
  const { mode, ...controlWithoutMode } = pipelineState.control || {};
  return {
    ...pipelineState,
    control: controlWithoutMode,
  };
}

function checkPackageFilePathConfigRequirements(pipelineState = {}) {
  return pipelineState;
}

function finalizePackageFilePathConfigState(pipelineState = {}) {
  return pipelineState;
}

module.exports = {
  START_MARKER,
  END_MARKER,
  EXAMPLE_START_MARKER,
  EXAMPLE_END_MARKER,
  prepareCwdPackageRootEnvironmentInput,
  checkCwdIsPackageRootRequirements,
  finalizeCwdPackageRootState,
  validatePackageFilePath,
  validateWritableBaseDirectoryForNewFile: assertPackageFileCanBeCreated,
  checkPackageFilePathConfigRequirements,
  finalizePackageFilePathConfigState,
  collectPackageFilePathEnvironmentInput,
  preparePackageFilePathEnvironmentInput,
  findManagedPlaceholder,
  checkPackageFilePathRequirements,
  finalizePackageFilePathState,
  collectDocLinkPlaceholderEnvironmentInput,
  prepareDocLinkPlaceholderEnvironmentInput,
  checkLinkPlaceholderRequirements,
  finalizeDocLinkPlaceholderState,
  createDocLinkFileIfNeeded,
  finalizeDocLinkFileInstallationState,
};
