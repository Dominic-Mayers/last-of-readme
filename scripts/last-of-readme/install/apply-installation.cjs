#!/usr/bin/env node

const {
  getCurrentFilesField,
  updatePackageJsonFields,
} = require('../adapters/npm-adapter.cjs');
const {
  createPackageFileIfAbsent,
} = require('../adapters/filesystem-adapter.cjs');
const { START_MARKER, END_MARKER } = require('./step-logic-filesystem.cjs');

function automatedInstall(pipelineState) {
  installDocLink(pipelineState);
  installRemotePackageJson(pipelineState);
  installDocLinkPackageJson(pipelineState);
}

function setPackageJsonFields(updates) {
  updatePackageJsonFields(updates);
}

function installRemotePackageJson(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const gitConfig = config.git || {};
  const remoteRepositoryConfig = config.remoteRepository || {};
  const remoteName = gitConfig.remoteName;

  if (!remoteName || !control.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.remoteName': remoteName,
    'lastOfReadme.remote.kind': remoteRepositoryConfig.kind,
    'lastOfReadme.remote.repositoryApiUrl':
      remoteRepositoryConfig.repositoryApiUrl,
    'lastOfReadme.remote.repositoryBrowserUrl':
      remoteRepositoryConfig.repositoryBrowserUrl,
  });

  return {
    path: 'package.json',
    remote: {
      localName: remoteName,
      kind: remoteRepositoryConfig.kind,
      repositoryApiUrl: remoteRepositoryConfig.repositoryApiUrl,
      repositoryBrowserUrl: remoteRepositoryConfig.repositoryBrowserUrl,
    },
  };
}

function installDocLinkPackageJson(pipelineState = {}) {
  const npmConfig = pipelineState.config?.npm || {};
  const control = pipelineState.control || {};
  const packageFilePath = npmConfig.packageFilePath;

  if (!packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.packageFilePath': packageFilePath,
    ...(typeof npmConfig.repositoryUrlPath === 'string'
      ? { 'lastOfReadme.repositoryUrlPath': npmConfig.repositoryUrlPath }
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
  const npmConfig = pipelineState.config?.npm || {};
  const control = pipelineState.control || {};
  const packageFilePath = npmConfig.packageFilePath;

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
  automatedInstall,
};
