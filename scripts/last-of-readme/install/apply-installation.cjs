#!/usr/bin/env node

const {
  getLastOfReadmeConfig, 
  getCurrentFilesField,
  updatePackageJsonFields,
} = require('../adapters/npm-adapter.cjs');
const {
  createPackageFileIfAbsent,
} = require('../adapters/filesystem-adapter.cjs');
const { START_MARKER, END_MARKER } = require('./step-logic-filesystem.cjs');
const {
  printConvenienceHookReminder,
} = require('../adapters/user-input-adapter.cjs');

async function applyInstallationRemainder(pipelineState) {
  installDocLink(pipelineState);
  installRemotePackageJson(pipelineState);
  installDocLinkPackageJson(pipelineState);
  installDefaultNonInteractivePolicy(pipelineState);
  return pipelineState;
}

function remindAboutConvenienceHooks(pipelineState) {
  const convenienceNeeds = (pipelineState.control || {}).convenienceNeeds || [];

  for (const need of convenienceNeeds) {
    printConvenienceHookReminder(need);
  }
}

function setPackageJsonFields(updates) {
  updatePackageJsonFields(updates);
}

function installDefaultNonInteractivePolicy(pipelineState = {}) {

  const currentConfig = getLastOfReadmeConfig(); 
  
  if (
    currentConfig.nonInteractiveFailurePolicy !== undefined
  ) {
    return;
  }
  
  setPackageJsonFields({
    'lastOfReadme.nonInteractiveFailurePolicy': 'continue',
  });
}

function installRemotePackageJson(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const remoteConfig = config.remote || {};
  const remoteName = config.remoteName;

  if (!remoteName || !control.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.remoteName': remoteName,
    'lastOfReadme.remote.kind': remoteConfig.kind,
    'lastOfReadme.remote.repositoryApiUrl':
      remoteConfig.repositoryApiUrl,
    'lastOfReadme.remote.repositoryBrowserUrl':
      remoteConfig.repositoryBrowserUrl,
  });

  return {
    path: 'package.json',
    remote: {
      localName: remoteName,
      kind: remoteConfig.kind,
      repositoryApiUrl: remoteConfig.repositoryApiUrl,
      repositoryBrowserUrl: remoteConfig.repositoryBrowserUrl,
    },
  };
}

function installDocLinkPackageJson(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const packageFilePath = config.packageFilePath;

  if (!packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  setPackageJsonFields({
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
    setPackageJsonFields({
      files: updatedFiles,
    });
  }

  return {
    path: 'package.json',
    packageFilePath,
    filesChanged: updatedFiles !== null,
  };
}

// TODO: The return value is not currently used by the installer.
// Decide whether installation steps should report results in a structured way.
function installDocLink(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const packageFilePath = config.packageFilePath;

  if (!packageFilePath || !control.mode) {
    throw new Error('Doc-link installation requires resolved doc-link cycle state');
  }

  if (control.mode === 'existing-file') {
    return {
      mode: 'existing-file',
      path: packageFilePath,
      changed: false,
    };
  }

  const minimalContent = `Last of Readme : ${START_MARKER}${END_MARKER}
`;
  createPackageFileIfAbsent(packageFilePath, minimalContent);

  return {
    mode: 'created-minimal-file',
    path: packageFilePath,
    changed: true,
  };
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

module.exports = {
  applyInstallationRemainder,
  remindAboutConvenienceHooks,
};
