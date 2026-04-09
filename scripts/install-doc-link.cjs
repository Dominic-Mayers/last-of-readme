#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function resolveWorkspacePath(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('docLinkPath is required');
  }

  const workspaceRoot = process.cwd();
  const absolutePath = path.resolve(workspaceRoot, relativePath);
  const relativeToRoot = path.relative(workspaceRoot, absolutePath);

  if (
    relativeToRoot === '' ||
    relativeToRoot === '..' ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error('docLinkPath must point to a file inside the current workspace');
  }

  return absolutePath;
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

function validateExistingDocLinkFile(absolutePath, relativePath) {
  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    throw new Error(`${relativePath} exists but is not a regular file`);
  }

  fs.accessSync(absolutePath, fs.constants.R_OK | fs.constants.W_OK);

  const content = fs.readFileSync(absolutePath, 'utf8');
  const managedPlaceholder = findManagedPlaceholder(content);

  if (!managedPlaceholder) {
    throw new Error(
      `${relativePath} does not contain a managed placeholder outside example regions`
    );
  }

  return {
    mode: 'existing-file',
    path: relativePath,
    managedPlaceholder,
  };
}

function checkDocLinkRequirements(config) {
  const docLinkPath = config && config.docLinkPath;
  const createMinimal = Boolean(config && config.createMinimal);
  const absolutePath = resolveWorkspacePath(docLinkPath);

  if (fs.existsSync(absolutePath)) {
    return validateExistingDocLinkFile(absolutePath, docLinkPath);
  }

  if (!createMinimal) {
    throw new Error(
      `${docLinkPath} does not exist. Select minimal-file creation to allow installation.`
    );
  }

  const parentDir = path.dirname(absolutePath);
  fs.mkdirSync(parentDir, { recursive: true });
  fs.accessSync(parentDir, fs.constants.W_OK);

  return {
    mode: 'create-minimal-file',
    path: docLinkPath,
  };
}

function installDocLink(config) {
  const requirement = checkDocLinkRequirements(config);

  if (requirement.mode === 'existing-file') {
    return {
      mode: 'existing-file',
      path: requirement.path,
      changed: false,
    };
  }

  const absolutePath = resolveWorkspacePath(config.docLinkPath);
  const minimalContent = `Last of Readme : ${START_MARKER}${END_MARKER}\n`;
  fs.writeFileSync(absolutePath, minimalContent, { flag: 'wx' });

  return {
    mode: 'created-minimal-file',
    path: config.docLinkPath,
    changed: true,
  };
}

function getPackageJsonPath() {
  return path.resolve(process.cwd(), 'package.json');
}

function readPackageJson() {
  const packageJsonPath = getPackageJsonPath();
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json was not found in the current workspace');
  }

  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read package.json: ${error.message}`);
  }
}

function writePackageJson(pkg) {
  const packageJsonPath = getPackageJsonPath();
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildVersionScript(docLinkPath, urlPath) {
  const quotedPath = shellQuote(docLinkPath);
  const quotedUrlPath = shellQuote(urlPath || '');
  return `node scripts/update-readme-link.cjs ${quotedPath} ${quotedUrlPath} && git add ${quotedPath}`;
}

function checkDocLinkPackageJsonRequirements() {
  const packageJsonPath = getPackageJsonPath();
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json was not found in the current workspace');
  }

  fs.accessSync(packageJsonPath, fs.constants.R_OK | fs.constants.W_OK);
  const pkg = readPackageJson();

  if (pkg.files !== undefined && !Array.isArray(pkg.files)) {
    throw new Error('package.json.files must be an array when present');
  }

  return { path: packageJsonPath };
}

function installDocLinkPackageJson(config) {
  const pkg = readPackageJson();
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.version = buildVersionScript(config.docLinkPath, config.urlPath);

  if (Array.isArray(pkg.files)) {
    if (!pkg.files.includes(config.docLinkPath)) {
      pkg.files.push(config.docLinkPath);
    }

    if (
      config.removePreviousDocLinkFromFiles &&
      config.previousDocLinkPath &&
      config.previousDocLinkPath !== config.docLinkPath
    ) {
      pkg.files = pkg.files.filter((item) => item !== config.previousDocLinkPath);
    }
  }

  writePackageJson(pkg);

  return {
    path: 'package.json',
    docLinkPath: config.docLinkPath,
    urlPath: config.urlPath || '',
  };
}

module.exports = {
  START_MARKER,
  END_MARKER,
  EXAMPLE_START_MARKER,
  EXAMPLE_END_MARKER,
  resolveWorkspacePath,
  findManagedPlaceholder,
  checkDocLinkRequirements,
  installDocLink,
  checkDocLinkPackageJsonRequirements,
  installDocLinkPackageJson,
  readPackageJson,
  buildVersionScript,
};
