#!/usr/bin/env node

const {
  getCurrentConfiguredRemoteName,
  getCurrentFilesField,
  getCurrentInstalledPackageFilePath,
  getCurrentRemoteConfiguration,
  getCurrentRepositoryUrlPath,
  getExistingInstallationFingerprint,
  getLastOfReadmeOwnedHookInstallationState,
  installLastOfReadmeOwnedHookCommand,
  npmPackageRoot,
  writeRemoteConfig,
  writeDocLinkConfig,
  writeNonInteractivePolicyIfAbsent,
} = require('../adapters/npm-adapter.cjs');

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

function installNonInteractivePolicyField(pipelineState = {}) {
  writeNonInteractivePolicyIfAbsent();
  return pipelineState;
}

function finalizeNonInteractivePolicyInstallationState(pipelineState = {}) {
  return pipelineState;
}

function installDocLinkConfigFields(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};

  if (!config.packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  writeDocLinkConfig({
    packageFilePath: config.packageFilePath,
    repositoryUrlPath: config.repositoryUrlPath,
    previousPackageFilePath: control.previousPackageFilePath,
    removePreviousPackageFileFromFiles: control.removePreviousPackageFileFromFiles,
  });

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

  if (!config.remoteName || !control.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  writeRemoteConfig({
    remoteName: config.remoteName,
    remote: config.remote || {},
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
    if (hookState.chosenAction === 'install' || hookState.chosenAction === 'prepend') {
      installLastOfReadmeOwnedHookCommand({
        hook: hookState.hook,
        command: hookState.command,
        remainingContent: hookState.remainingContent,
      });
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
