#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function checkDocLinkRequirements(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = resolvePackageFilePath(input.packageFilePath);
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

function resolvePackageFilePath(packageFilePath) {
  if (!packageFilePath || typeof packageFilePath !== 'string') {
    throw new Error('packageFilePath is required');
  }

  const normalizedPath = path.normalize(packageFilePath);

  if (
    normalizedPath === '.' ||
    normalizedPath === '..' ||
    normalizedPath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(normalizedPath)
  ) {
    throw new Error('packageFilePath must point to a file inside the current repository');
  }

  return normalizedPath;
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

function checkDocLinkPackageJsonRequirements() {
  return { path: 'package.json' };
}

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

  const parentDir = path.dirname(docLink.packageFilePath);
  if (parentDir && parentDir !== '.') {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const minimalContent = `Last of Readme : ${START_MARKER}${END_MARKER}\n`;
  fs.writeFileSync(docLink.packageFilePath, minimalContent, { flag: 'wx' });

  return {
    mode: 'created-minimal-file',
    path: docLink.packageFilePath,
    changed: true,
  };
}

function installDocLinkPackageJson(config = {}) {
  const docLink = config.docLink;

  if (!docLink || !docLink.packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  const assignments = [
    `lastOfReadme.packageFilePath=${JSON.stringify(docLink.packageFilePath)}`,
  ];

  if (typeof docLink.repositoryUrlPath === 'string') {
    assignments.push(
      `lastOfReadme.repositoryUrlPath=${JSON.stringify(docLink.repositoryUrlPath)}`
    );
  }

  setPackageJsonFields(assignments);

  const currentFiles = getCurrentFilesField();
  const updatedFiles = updateFilesField(
    currentFiles,
    docLink.packageFilePath,
    docLink.previousPackageFilePath,
    Boolean(docLink.removePreviousPackageFileFromFiles)
  );

  if (updatedFiles !== null) {
    setPackageJsonFields([`files=${JSON.stringify(updatedFiles)}`]);
  }

  return {
    path: 'package.json',
    packageFilePath: docLink.packageFilePath,
    filesChanged: updatedFiles !== null,
  };
}

function getCurrentFilesField() {
  const files = getPackageJsonField('files', { allowFailure: true });
  return Array.isArray(files) ? files : null;
}

function runNpmPkg(args, failureMessage, { expectJson = false } = {}) {
  const result = spawnSync('npm', ['pkg', ...args], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(`${failureMessage}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${failureMessage}${detail ? `: ${detail}` : ''}`);
  }

  const raw = result.stdout ?? '';

  if (!expectJson) {
    return raw;
  }

  if (raw === '') {
    throw new Error(`${failureMessage}: npm pkg ${args.join(' ')} returned no output`);
  }

  try {
    return JSON.parse(raw.trim());
  } catch (error) {
    throw new Error(`${failureMessage}: ${error.message}`);
  }
}

function setPackageJsonFields(assignments) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return;
  }

  runNpmPkg(['set', '--json', ...assignments], 'Could not update package.json');
}

function getPackageJsonField(field, { allowFailure = false } = {}) {
  let value;

  try {
    value = runNpmPkg(
      ['get', field, '--json'],
      `Could not read package.json field "${field}"`,
      { expectJson: true }
    );
  } catch (error) {
    if (allowFailure) {
      return undefined;
    }
    throw error;
  }

  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) && value.length === 1 ? value[0] : value;
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
  START_MARKER,
  END_MARKER,
  EXAMPLE_START_MARKER,
  EXAMPLE_END_MARKER,
  resolvePackageFilePath,
  findManagedPlaceholder,
  checkDocLinkRequirements,
  installDocLink,
  checkDocLinkPackageJsonRequirements,
  installDocLinkPackageJson,
  getPackageJsonField,
  getCurrentFilesField,
  updateFilesField,
};
