#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { runNpmPkg } = require('../runNpmPkg.cjs'); 

const WORKSPACE_ROOT = process.cwd();
const PACKAGE_PATH = path.join(WORKSPACE_ROOT, 'package.json');

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

function getPackageJsonField(field, { allowEmpty = false } = {}) {

  const value = runNpmPkg(['get', field, '--json'], { expectJson: true });
  const normalized = Array.isArray(value) && value.length === 1 ? value[0] : value;

  if ((normalized === undefined || normalized === null || normalized === '') && !allowEmpty) {
    fail(`package.json has no ${field}`);
  }

  return normalized;
}

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

function ensureGitWorkspace() {
  try {
    run('git rev-parse --is-inside-work-tree');
  } catch {
    fail('Current directory is not a Git repository');
  }
}

function currentRepoNode() {
  ensureGitWorkspace();
  return run('git rev-parse HEAD');
}

function currentPackageVersion() {
  return String(getPackageJsonField('version'));
}

function packageName() {
  return String(getPackageJsonField('name'));
}

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

function remoteRepository() {
  return remoteConfiguration().repository;
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

module.exports = {
  remoteConfiguration,
  remoteRepository,
  currentRepoNode,
  readFile,
  writeFile,
  setTag,
  publishTag,
  packageName,
  currentPackageVersion,
  remoteName,
  packageFilePath,
  repositoryUrlPath,
};
