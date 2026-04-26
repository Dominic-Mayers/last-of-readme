#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { execFileSync } = require('child_process');
const { runNpmPkg } = require('../runNpmPkg.cjs'); 
const {
  assertExistingReadableWritableRegularFile,
  normalizeOptionalText,
} = require('../install/utils.cjs'); 
const {
  askRemoteChoice,
  askPackageFilePath,
  askRepositoryUrlPath,
  askRemovePreviousPackageFile,
  printMissingPackageFileInformation,
  askCreateMinimalPackageFile,
} = require('./prompt-user-input.cjs');

const WORKSPACE_ROOT = process.cwd();
const PACKAGE_PATH = path.join(WORKSPACE_ROOT, 'package.json');

// Git functions

function assertGitAvailable() {
  try {
    gitVersion();
  } catch (error) {
    throw new Error('Git must be installed and available in PATH');
  }
}

function assertInGitRepository() {
  try {
    gitTopLevel();
  } catch (error) {
    throw new Error('Install must be run inside a Git repository');
  }
}

function assertAtRepoRoot() {
  const repoRoot = gitTopLevel();
  const cwd = currentWorkingDirectory();

  if (cwd !== repoRoot) {
    throw new Error(
      `Install must be run from the repository root.\nCurrent directory: ${cwd}\nRepository root: ${repoRoot}`
    );
  }
}

function currentRepoNode() {
  ensureGitWorkspace();
  return run('git rev-parse HEAD');
}

function setTag(tag, repoNode, annotation) {
  ensureGitWorkspace();

  try {
    run(`git rev-parse -q --verify refs/tags/${JSON.stringify(tag)}`);
    fail(`Tag already exists: ${tag}`);
  } catch (err) {
    if (err.isWorkspaceApiError) {
      throw err;
    }
  }

  cp.execSync(
    `git tag -a ${JSON.stringify(tag)} ${JSON.stringify(repoNode)} -m ${JSON.stringify(annotation)}`,
    { stdio: 'inherit' }
  );
}

function publishTag(tag, remote = remoteName()) {
  ensureGitWorkspace();
  cp.execSync(`git push ${JSON.stringify(remote)} ${JSON.stringify(tag)}`, {
    stdio: 'inherit',
  });
}

// Npm functions

// In update-readme-link.cjs.
function remoteConfiguration() {
  const kind = getPackageJsonField('lastOfReadme.remote.kind', { allowEmpty: true });
  const host = getPackageJsonField('lastOfReadme.remote.host', { allowEmpty: true });
  const repository = getPackageJsonField('lastOfReadme.remote.repository', { allowEmpty: true });

  if (kind !== undefined && kind !== null && kind !== '') {
    if (kind !== 'github') {
      fail('package.json lastOfReadme.remote.kind must be "github"');
    }
    if (!host || !repository) {
      fail('package.json lastOfReadme.remote must include host and repository');
    }
    return {
      kind: 'github',
      host: String(host),
      repository: String(repository),
    };
  }

  return normalizeRepositoryUrl(getPackageJsonField('repository'));
}

function remoteName() {
  const configuredRemoteName = getPackageJsonField('lastOfReadme.remoteName', { allowEmpty: true });
  if (configuredRemoteName && typeof configuredRemoteName === 'string') {
    return configuredRemoteName;
  }
  return 'origin';
}

function currentPackageVersion() {
  return String(getPackageJsonField('version'));
}

function packageName() {
  return String(getPackageJsonField('name'));
}

function packageFilePath() {
  const value = getPackageJsonField('lastOfReadme.packageFilePath', { allowEmpty: true });
  if (!value || typeof value !== 'string') {
    fail('package.json has no lastOfReadme.packageFilePath');
  }
  return value;
}

function repositoryUrlPath() {
  const config = getPackageJsonField('lastOfReadme', { allowEmpty: true });

  if (!config || typeof config !== 'object') {
    fail('package.json has no lastOfReadme configuration');
  }

  const value = config.repositoryUrlPath;

  if (typeof value !== 'string') {
    fail('package.json has no valid lastOfReadme.repositoryUrlPath');
  }

  return value;
}

function getCurrentInstalledPackageFilePath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return null;
  }
  return typeof lastOfReadme.packageFilePath === 'string'
    ? lastOfReadme.packageFilePath
    : null;
}

function getCurrentRepositoryUrlPath() {
  const lastOfReadme = getPackageJsonField('lastOfReadme', { allowEmpty: true });
  if (!lastOfReadme || typeof lastOfReadme !== 'object') {
    return '';
  }
  return typeof lastOfReadme.repositoryUrlPath === 'string'
    ? lastOfReadme.repositoryUrlPath
    : '';
}

function getCurrentFilesField() {
  const files = getPackageJsonField('files', { allowEmpty: true });
  return Array.isArray(files) ? files : null;
}

function assertPackageManifestReadableByNpm() {
  if (!fs.existsSync(PACKAGE_PATH)) {
    throw new Error('package.json must exist at the repository root');
  }

  try {
    execFileSync('npm', ['pkg', 'get', 'version'], {
      cwd: WORKSPACE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch (error) {
    const detail = error && error.stderr ? String(error.stderr).trim() : '';
    const suffix = detail ? `\n${detail}` : '';
    throw new Error(
      `npm must recognize package.json as the package manifest in this repository${suffix}`
    );
  }
}

function updatePackageJsonFields(updates) {
  const assignments = Object.entries(updates).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`
  );

  runNpmPkg(
    ['set', '--json', ...assignments],
    {
      allowEmpty: true,
      failureMessage: 'Could not update package.json',
    }
  );
}

// Package file functions

// Boundary-level requirement check used by installer phase logic.
// It delegates to the lower-level file check but throws in installation
// requirement terms.
function validateExistingPackageFile(packageFilePath) {
  try {
    assertExistingReadableWritableRegularFile(packageFilePath);
  } catch (error) {
    throw new Error(
      `${packageFilePath} must be an existing regular file readable and writable for Last of Readme to run`
    );
  }
}

// Secondary operational check (very unexpected failure)
function assertPackageFileReadyForPlaceholderInspection(packageFilePath) {
  try {
    assertExistingReadableWritableRegularFile(packageFilePath);
  } catch (error) {
    throw new Error(
      `Unexpected package-file access failure while inspecting the managed placeholder in ${packageFilePath}`
    );
  }
}


// TODO: The current check allows a parent path that exists but is a file,
// which later causes fs.mkdirSync to fail with a low-level EEXIST error.
// The installer should detect this earlier and report a clear, user-facing error:
// e.g. "package.json exists but is not a directory".
// This was pre-existing behavior and is intentionally preserved for now.
function assertPackageFileCanBeCreated(packageFilePath) {
  let candidateDirectory = path.dirname(packageFilePath);

  while (
    candidateDirectory &&
    candidateDirectory !== '.' &&
    !fs.existsSync(candidateDirectory)
  ) {
    const parentDirectory = path.dirname(candidateDirectory);

    if (parentDirectory === candidateDirectory) {
      break;
    }

    candidateDirectory = parentDirectory;
  }

  if (candidateDirectory && candidateDirectory !== '.') {
    fs.accessSync(candidateDirectory, fs.constants.W_OK);
  }
}

function packageFileExists(packageFilePath) {
  return fs.existsSync(packageFilePath);
}

function readPackageFileContent(packageFilePath) {
  return fs.readFileSync(packageFilePath, 'utf8');
}

function createPackageFileIfAbsent(packageFilePath, content) {
  const parentDir = path.dirname(packageFilePath);
  if (parentDir && parentDir !== '.') {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(packageFilePath, content, { flag: 'wx' });
}

// File system functions

function resolveWorkspacePath(relativePath) {
  if (!relativePath) {
    fail('Path is required');
  }
  return path.join(WORKSPACE_ROOT, relativePath);
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} not found`);
  }
}

function readFile(relativePath) {
  const filePath = resolveWorkspacePath(relativePath);
  ensureFile(filePath, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    fail(`Could not read ${relativePath}: ${err.message}`);
  }
}

function writeFile(relativePath, content) {
  const filePath = resolveWorkspacePath(relativePath);
  try {
    fs.writeFileSync(filePath, content);
  } catch (err) {
    fail(`Could not write ${relativePath}: ${err.message}`);
  }
}

// Adapter-zone functions

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function parseBooleanAnswer(value, defaultValue) {
  const normalized = normalizeOptionalText(value).toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (['y', 'yes', 'true'].includes(normalized)) {
    return true;
  }

  if (['n', 'no', 'false'].includes(normalized)) {
    return false;
  }

  throw new Error('Please answer yes or no');
}

function getRemotesFromGit() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}

function chooseDefaultRemoteName(remotes) {
  if (remotes.length === 1) {
    return remotes[0].name;
  }

  return '';
}

function formatRemoteChoices(remotes) {
  if (remotes.length === 0) {
    return '  (no Git remotes found)';
  }

  return remotes
    .map(({ name, url }, index) => `  ${index + 1}. ${name} (${url})`)
    .join('\n');
}

function resolveSelectedRemote(answer, remotes, defaultRemoteName) {
  const trimmed = normalizeOptionalText(answer);
  const value = trimmed || defaultRemoteName;

  if (!value) {
    return null;
  }

  if (['none', 'no', 'skip'].includes(value.toLowerCase())) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    const index = Number(value) - 1;

    if (index >= 0 && index < remotes.length) {
      return remotes[index];
    }

    throw new Error('Please choose a listed remote by number or by name');
  }

  const byName = remotes.find(({ name }) => name === value);

  if (byName) {
    return byName;
  }

  throw new Error('Please choose a listed remote by number or by name');
}

async function collectRemoteInput(config = {}) {
  const remotes = getRemotesFromGit();
  const defaultRemoteName = chooseDefaultRemoteName(remotes);
  const rl = createInterface();

  try {
    const remoteAnswer = await askRemoteChoice({
      askQuestion: (question) => ask(rl, question),
      remotesDisplay: formatRemoteChoices(remotes),
      defaultRemoteName,
    });

    const selectedRemote = resolveSelectedRemote(
      remoteAnswer,
      remotes,
      defaultRemoteName
    );

    return {
      ...config,
      remote: {
        ...(config.remote || {}),
        localName: selectedRemote ? selectedRemote.name : null,
      },
    };
  } finally {
    rl.close();
  }
}

function getDefaultPackageFilePath() {
  return getCurrentInstalledPackageFilePath() || 'README.md';
}

function getDefaultRepositoryUrlPath() {
  return getCurrentRepositoryUrlPath() || '';
}

function shouldAskToRemovePreviousPackageFile({
  previousPackageFilePath,
  nextPackageFilePath,
  currentFiles,
}) {
  return (
    Array.isArray(currentFiles) &&
    typeof previousPackageFilePath === 'string' &&
    previousPackageFilePath.length > 0 &&
    previousPackageFilePath !== nextPackageFilePath &&
    currentFiles.includes(previousPackageFilePath)
  );
}

function shouldShowRepositoryUrlPathInformation(repositoryUrlPath) {
  return !repositoryUrlPath;
}

function resolveCollectedPackageFilePathAnswer(packageFilePathAnswer) {
  const defaultPackageFilePath = getDefaultPackageFilePath();
  return normalizeOptionalText(packageFilePathAnswer) || defaultPackageFilePath;
}

function resolveCollectedRepositoryUrlPathAnswer(repositoryUrlPathAnswer) {
  const defaultRepositoryUrlPath = getDefaultRepositoryUrlPath();

  if (repositoryUrlPathAnswer === '') {
    return defaultRepositoryUrlPath;
  }

  return normalizeOptionalText(repositoryUrlPathAnswer);
}

async function collectPackageFilePathInput(config = {}) {
  const previousPackageFilePath = getCurrentInstalledPackageFilePath();
  const currentFiles = getCurrentFilesField();
  const defaultPackageFilePath = getDefaultPackageFilePath();
  const defaultRepositoryUrlPath = getDefaultRepositoryUrlPath();

  const rl = createInterface();

  try {
    const packageFilePathAnswer = await askPackageFilePath({
      askQuestion: (question) => ask(rl, question),
      defaultPackageFilePath,
    });

    const repositoryUrlPathAnswer = await askRepositoryUrlPath({
      askQuestion: (question) => ask(rl, question),
      defaultRepositoryUrlPath,
      shouldShowRepositoryUrlPathInformationForAnswer: (answer) =>
        shouldShowRepositoryUrlPathInformation(
          resolveCollectedRepositoryUrlPathAnswer(answer)
        ),
    });

    let removePreviousPackageFileFromFiles = false;
    const effectivePackageFilePath = resolveCollectedPackageFilePathAnswer(
      packageFilePathAnswer
    );

    if (
      shouldAskToRemovePreviousPackageFile({
        previousPackageFilePath,
        nextPackageFilePath: effectivePackageFilePath,
        currentFiles,
      })
    ) {
      const removePreviousFileAnswer = await askRemovePreviousPackageFile({
        askQuestion: (question) => ask(rl, question),
        previousPackageFilePath,
      });

      removePreviousPackageFileFromFiles =
        parseBooleanAnswer(removePreviousFileAnswer, false);
    }

    return {
      ...config,
      docLink: {
        ...(config.docLink || {}),
        packageFilePathAnswer,
        repositoryUrlPathAnswer,
        previousPackageFilePath,
        removePreviousPackageFileFromFiles,
      },
    };
  } finally {
    rl.close();
  }
}

async function collectDocLinkPlaceholderInput(config = {}) {
  const docLink = config.docLink || {};

  if (docLink.packageFileExists) {
    return config;
  }

  const packageFilePath = docLink.packageFilePath;
  const rl = createInterface();

  try {
    printMissingPackageFileInformation(packageFilePath);

    const createMinimalFileAnswer = await askCreateMinimalPackageFile({
      askQuestion: (question) => ask(rl, question),
    });
    const shouldCreateMinimalFile =
      parseBooleanAnswer(createMinimalFileAnswer, false);

    return {
      ...config,
      docLink: {
        ...(config.docLink || {}),
        shouldCreateMinimalFile,
      },
    };
  } finally {
    rl.close();
  }
}

function fail(message) {
  const error = new Error(message);
  error.isWorkspaceApiError = true;
  throw error;
}

function run(command, options = {}) {
  return cp.execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function gitVersion() {
  return execFileSync('git', ['--version'], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function gitTopLevel() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function currentWorkingDirectory() {
  return process.cwd();
}

function gitRemoteNames() {
  const output = execFileSync('git', ['remote'], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();

  return output
    ? output.split(/\r?\n/).map((name) => name.trim()).filter(Boolean)
    : [];
}

function gitRemoteUrl(remoteName) {
  return execFileSync('git', ['remote', 'get-url', remoteName], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function ensureGitWorkspace() {
  try {
    run('git rev-parse --is-inside-work-tree');
  } catch {
    fail('Current directory is not a Git repository');
  }
}

function normalizeRepositoryUrl(repository) {
  let url =
    typeof repository === 'string'
      ? repository
      : repository && typeof repository.url === 'string'
        ? repository.url
        : null;

  if (!url) {
    fail('package.json has no valid repository.url');
  }

  url = url.trim();

  if (url.startsWith('git+')) {
    url = url.slice(4);
  }

  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  let match = url.match(/^https:\/\/([^/]+)\/([^/]+\/[^/]+)\/?$/);
  if (match) {
    return { kind: 'github', host: match[1], repository: match[2] };
  }

  match = url.match(/^git@([^:]+):([^/]+\/[^/]+)$/);
  if (match) {
    return { kind: 'github', host: match[1], repository: match[2] };
  }

  match = url.match(/^ssh:\/\/git@([^/]+)\/([^/]+\/[^/]+)$/);
  if (match) {
    return { kind: 'github', host: match[1], repository: match[2] };
  }

  fail('repository.url must point to a GitHub repository');
}

function getPackageJsonField(field, { allowEmpty = false } = {}) {

  const value = runNpmPkg(['get', field, '--json'], { expectJson: true });
  const normalized = Array.isArray(value) && value.length === 1 ? value[0] : value;

  if ((normalized === undefined || normalized === null || normalized === '') && !allowEmpty) {
    fail(`package.json has no ${field}`);
  }

  return normalized;
}

module.exports = {
    collectRemoteInput,
    collectPackageFilePathInput,
    collectDocLinkPlaceholderInput,
    assertGitAvailable,
    assertInGitRepository,
    assertAtRepoRoot,
    getCurrentInstalledPackageFilePath,
    getCurrentRepositoryUrlPath,
    getCurrentFilesField,
    repositoryUrlPath,
    packageFilePath,
    remoteName,
    remoteConfiguration,
    currentRepoNode,
    readFile,
    writeFile,
    setTag,
    publishTag,
    packageName,
    currentPackageVersion,
    gitRemoteUrl,
    validateExistingPackageFile,
    assertPackageFileReadyForPlaceholderInspection,
    assertPackageManifestReadableByNpm,
    updatePackageJsonFields,
    assertPackageFileCanBeCreated,
    packageFileExists,
    readPackageFileContent,
    createPackageFileIfAbsent
};
