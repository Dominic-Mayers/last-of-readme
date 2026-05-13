#!/usr/bin/env node

const {
  getCurrentConfiguredRemoteName,
  getCurrentFilesField,
  getCurrentInstalledPackageFilePath,
  getCurrentRemoteConfiguration,
  getCurrentRepositoryUrlPath,
  getExistingInstallationFingerprint,
  getLastOfReadmeConfig,
  getLastOfReadmeOwnedHookInstallationState,
  installLastOfReadmeOwnedHookCommand,
  npmPackageRoot,
  updatePackageJsonFields,
} = require('../adapters/npm-adapter.cjs');
const {
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
} = require('../adapters/user-input-adapter.cjs');

function collectNpmPackageRootEnvironmentInput(pipelineState = {}) {
  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      npmPackageRootAnswer: npmPackageRoot(),
    },
  };
}

function collectConfiguredRemoteNameEnvironmentInput(pipelineState = {}) {
  const configuredRemoteNameAnswer = getCurrentConfiguredRemoteName();

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      configuredRemoteNameAnswer,
    },
  };
}

function collectCurrentRemoteConfigurationEnvironmentInput(pipelineState = {}) {
  const currentRemoteConfiguration = getCurrentRemoteConfiguration();

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      currentRemoteConfiguration,
    },
  };
}

function collectPackageFilePathDefaultsEnvironmentInput(pipelineState = {}) {
  const previousPackageFilePath = getCurrentInstalledPackageFilePath();
  const currentFiles = getCurrentFilesField();
  const defaultPackageFilePath = previousPackageFilePath || 'README.md';
  const defaultRepositoryUrlPath = getCurrentRepositoryUrlPath() || '';

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      previousPackageFilePath,
      currentFiles,
      defaultPackageFilePath,
      defaultRepositoryUrlPath,
    },
  };
}


function collectExistingInstallationEnvironmentInput(pipelineState = {}) {
  const fingerprint = getExistingInstallationFingerprint();

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      existingInstallationDetected: fingerprint !== null,
      existingInstallationDetails: fingerprint,
    },
  };
}

function finalizeExistingInstallationState(pipelineState = {}) {
  const {
    existingInstallationDetected,
    existingInstallationDetails,
    ...controlWithoutInstallationInput
  } = pipelineState.control || {};

  return {
    ...pipelineState,
    control: controlWithoutInstallationInput,
  };
}

// Last of Readme-owned commands installed in npm version lifecycle hooks.
// User-visible explanations live in prompt-user-input.cjs.
const LAST_OF_README_OWNED_VERSION_HOOKS = [
  {
    hook: 'preversion',
    command:
      'last-of-readme attempt-check-contract && last-of-readme attempt-successor-tag',
  },
  {
    hook: 'version',
    command: 'last-of-readme attempt-readme-link',
  },
];

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

function installNonInteractivePolicyField(pipelineState = {}) {
  const currentConfig = getLastOfReadmeConfig();

  if (currentConfig.nonInteractiveFailurePolicy !== undefined) {
    return pipelineState;
  }

  updatePackageJsonFields({
    'lastOfReadme.nonInteractiveFailurePolicy': 'continue',
  });

  return pipelineState;
}

function finalizeNonInteractivePolicyInstallationState(pipelineState = {}) {
  return pipelineState;
}

function installDocLinkConfigFields(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const packageFilePath = config.packageFilePath;

  if (!packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  updatePackageJsonFields({
    'lastOfReadme.packageFilePath': packageFilePath,
    ...(typeof config.repositoryUrlPath === 'string'
      ? { 'lastOfReadme.repositoryUrlPath': config.repositoryUrlPath }
      : {}),
  });

  const currentFiles = getCurrentFilesField();
  const updatedFiles = updateFilesField(
    currentFiles,
    packageFilePath,
    control.previousPackageFilePath,
    Boolean(control.removePreviousPackageFileFromFiles)
  );

  if (updatedFiles !== null) {
    updatePackageJsonFields({ files: updatedFiles });
  }

  return pipelineState;
}

function finalizeDocLinkConfigInstallationState(pipelineState = {}) {
  const {
    previousPackageFilePath,
    removePreviousPackageFileFromFiles,
    ...controlWithoutDocLinkConfigInput
  } = pipelineState.control || {};
  return {
    ...pipelineState,
    control: controlWithoutDocLinkConfigInput,
  };
}

function installRemoteConfigFields(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const remoteConfig = config.remote || {};
  const remoteName = config.remoteName;

  if (!remoteName || !control.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  updatePackageJsonFields({
    'lastOfReadme.remoteName': remoteName,
    'lastOfReadme.remote.kind': remoteConfig.kind,
    'lastOfReadme.remote.repositoryApiUrl': remoteConfig.repositoryApiUrl,
    'lastOfReadme.remote.repositoryBrowserUrl': remoteConfig.repositoryBrowserUrl,
  });

  return pipelineState;
}

function finalizeRemoteConfigInstallationState(pipelineState = {}) {
  const { repositoryUrl, ...controlWithoutRepositoryUrl } = pipelineState.control || {};
  return {
    ...pipelineState,
    control: controlWithoutRepositoryUrl,
  };
}

function collectLastOfReadmeOwnedVersionHooksEnvironmentInput(
  pipelineState = {}
) {
  const lastOfReadmeOwnedVersionHookStates =
    LAST_OF_README_OWNED_VERSION_HOOKS.map(({ hook, command }) =>
      getLastOfReadmeOwnedHookInstallationState({ hook, command })
    );

  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      lastOfReadmeOwnedVersionHookStates,
    },
  };
}

function installLastOfReadmeOwnedVersionHookCommands(pipelineState = {}) {
  const hookStates =
    (pipelineState.control || {}).lastOfReadmeOwnedVersionHookStates || [];

  for (const hookState of hookStates) {
    if (hookState.chosenAction === 'install') {
      installLastOfReadmeOwnedHookCommand({
        hook: hookState.hook,
        command: hookState.command,
        remainingContent: hookState.remainingContent,
      });
      printFingerprintedHookInstalled(hookState.hook);
    } else if (hookState.chosenAction === 'prepend') {
      installLastOfReadmeOwnedHookCommand({
        hook: hookState.hook,
        command: hookState.command,
        remainingContent: hookState.remainingContent,
      });
      printFingerprintedHookPrepended(hookState.hook);
    }
  }

  return pipelineState;
}

function finalizeLastOfReadmeOwnedVersionHooksInstallationState(
  pipelineState = {}
) {
  const {
    lastOfReadmeOwnedVersionHookStates,
    ...controlWithoutOwnedHookInput
  } = pipelineState.control || {};

  return {
    ...pipelineState,
    control: controlWithoutOwnedHookInput,
  };
}

module.exports = {
  collectNpmPackageRootEnvironmentInput,
  collectConfiguredRemoteNameEnvironmentInput,
  collectCurrentRemoteConfigurationEnvironmentInput,
  collectPackageFilePathDefaultsEnvironmentInput,
  collectExistingInstallationEnvironmentInput,
  finalizeExistingInstallationState,
  installNonInteractivePolicyField,
  finalizeNonInteractivePolicyInstallationState,
  installDocLinkConfigFields,
  finalizeDocLinkConfigInstallationState,
  installRemoteConfigFields,
  finalizeRemoteConfigInstallationState,
  collectLastOfReadmeOwnedVersionHooksEnvironmentInput,
  installLastOfReadmeOwnedVersionHookCommands,
  finalizeLastOfReadmeOwnedVersionHooksInstallationState,
};
