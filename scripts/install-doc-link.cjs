#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

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

function checkDocLinkRequirements(config = {}) {
  const input = config.docLink || {};
  const packageFilePath = resolvePackageFilePath(input.packageFilePath);
  const repositoryUrlPath = input.repositoryUrlPath || '';
  const shouldCreateMinimalFile = Boolean(input.shouldCreateMinimalFile);
  const previousPackageFilePath = input.previousPackageFilePath || null;
  const removePreviousPackageFileFromFiles = Boolean(
    input.removePreviousPackageFileFromFiles
  );

  if (fs.existsSync(packageFilePath)) {
    const validation = validateExistingDocLinkFile(packageFilePath);
    return {
      ...config,
      docLink: {
        packageFilePath,
        repositoryUrlPath,
        mode: validation.mode,
        shouldCreateMinimalFile,
        previousPackageFilePath,
        removePreviousPackageFileFromFiles,
      },
    };
  }

  if (!shouldCreateMinimalFile) {
    throw new Error(
      `${packageFilePath} does not exist. Select minimal-file creation to allow installation.`
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
      packageFilePath,
      repositoryUrlPath,
      mode: 'create-minimal-file',
      shouldCreateMinimalFile,
      previousPackageFilePath,
      removePreviousPackageFileFromFiles,
    },
  };
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

function runNpmPkg(args, failureMessage) {
  const result = spawnSync('npm', ['pkg', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(`${failureMessage}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const suffix = (result.stderr || result.stdout || '').trim();
    throw new Error(`${failureMessage}${suffix ? `: ${suffix}` : ''}`);
  }

  return (result.stdout || '').trim();
}

function getPackageJsonField(field) {
  const raw = runNpmPkg(['get', field, '--json'], `Could not read package.json field "${field}"`);

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
  } catch (error) {
    throw new Error(
      `Could not parse package.json field "${field}" from npm pkg get: ${error.message}`
    );
  }
}

function setPackageJsonFields(assignments) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return;
  }

  runNpmPkg(['set', '--json', ...assignments], 'Could not update package.json');
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildVersionScript(packageFilePath, repositoryUrlPath) {
  const quotedPath = shellQuote(packageFilePath);
  const quotedUrlPath = shellQuote(repositoryUrlPath || '');
  return `node scripts/update-readme-link.cjs ${quotedPath} ${quotedUrlPath} && git add ${quotedPath}`;
}

function checkDocLinkPackageJsonRequirements() {
  return { path: 'package.json' };
}

function installDocLinkPackageJson(config = {}) {
  const docLink = config.docLink;

  if (!docLink || !docLink.packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  const assignments = [
    `lastOfReadme.packageFilePath=${JSON.stringify(docLink.packageFilePath)}`,
    `lastOfReadme.repositoryUrlPath=${JSON.stringify(docLink.repositoryUrlPath || '')}`,
    `scripts.version=${JSON.stringify(
      buildVersionScript(docLink.packageFilePath, docLink.repositoryUrlPath)
    )}`,
  ];

  setPackageJsonFields(assignments);

  const files = getPackageJsonField('files');
  if (Array.isArray(files)) {
    const nextFiles = [...files];

    if (!nextFiles.includes(docLink.packageFilePath)) {
      nextFiles.push(docLink.packageFilePath);
    }

    if (
      docLink.removePreviousPackageFileFromFiles &&
      docLink.previousPackageFilePath &&
      docLink.previousPackageFilePath !== docLink.packageFilePath
    ) {
      const filteredFiles = nextFiles.filter(
        (item) => item !== docLink.previousPackageFilePath
      );
      setPackageJsonFields([`files=${JSON.stringify(filteredFiles)}`]);
    } else if (nextFiles.length !== files.length) {
      setPackageJsonFields([`files=${JSON.stringify(nextFiles)}`]);
    }
  }

  return {
    path: 'package.json',
    packageFilePath: docLink.packageFilePath,
    repositoryUrlPath: docLink.repositoryUrlPath || '',
  };
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
  buildVersionScript,
};
