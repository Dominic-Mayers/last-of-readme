#!/usr/bin/env node

const {
  getCurrentFilesField,
  updatePackageJsonFields,
} = require('../adapters/npm-adapter.cjs');
const {
  createPackageFileIfAbsent,
} = require('../adapters/filesystem-adapter.cjs');
const { START_MARKER, END_MARKER } = require('./step-logic-filesystem.cjs');

function automatedInstall(config) {
  installDocLink(config);
  installRemotePackageJson(config);
  installDocLinkPackageJson(config);
}

function setPackageJsonFields(updates) {
  updatePackageJsonFields(updates);
}

function installRemotePackageJson(config = {}) {
  const remote = config.remote;

  if (!remote || !remote.localName || !remote.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.remoteName': remote.localName,
    'lastOfReadme.remote.kind': remote.kind,
    'lastOfReadme.remote.repositoryApiUrl': remote.repositoryApiUrl,
    'lastOfReadme.remote.repositoryBrowserUrl': remote.repositoryBrowserUrl,
  });

  return {
    path: 'package.json',
    remote: {
      localName: remote.localName,
      kind: remote.kind,
      repositoryApiUrl: remote.repositoryApiUrl,
      repositoryBrowserUrl: remote.repositoryBrowserUrl,
    },
  };
}

function installDocLinkPackageJson(config = {}) {
  const docLink = config.docLink;

  if (!docLink || !docLink.packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.packageFilePath': docLink.packageFilePath,
    ...(typeof docLink.repositoryUrlPath === 'string'
      ? { 'lastOfReadme.repositoryUrlPath': docLink.repositoryUrlPath }
      : {}),
  });

  const currentFiles = getCurrentFilesField();
  const updatedFiles = updateFilesField(
    currentFiles,
    docLink.packageFilePath,
    docLink.previousPackageFilePath,
    Boolean(docLink.removePreviousPackageFileFromFiles)
  );

  if (updatedFiles !== null) {
    setPackageJsonFields({
      files: updatedFiles,
    });
  }

  return {
    path: 'package.json',
    packageFilePath: docLink.packageFilePath,
    filesChanged: updatedFiles !== null,
  };
}

// TODO: The return value is not currently used by the installer.
// Decide whether installation steps should report results in a structured way.
function installDocLink(config = {}) {
  const docLink = config.docLink;
  if (!docLink || !docLink.packageFilePath || !docLink.mode) {
    throw new Error('Doc-link installation requires resolved doc-link cycle state');
  }

  if (docLink.mode === 'existing-file') {
    return {
      mode: 'existing-file',
      path: docLink.packageFilePath,
      changed: false,
    };
  }

  const minimalContent = `Last of Readme : ${START_MARKER}${END_MARKER}
`;
  createPackageFileIfAbsent(docLink.packageFilePath, minimalContent);

  return {
    mode: 'created-minimal-file',
    path: docLink.packageFilePath,
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
