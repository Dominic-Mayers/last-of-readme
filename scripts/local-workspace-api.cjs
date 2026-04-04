#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

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

function readPackageJson() {
  ensureFile(PACKAGE_PATH, 'package.json');
  try {
    return JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  } catch (err) {
    fail(`Could not read package.json: ${err.message}`);
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

  let match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)$/);
  if (match) return match[1];

  match = url.match(/^git@github\.com:([^/]+\/[^/]+)$/);
  if (match) return match[1];

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
  const pkg = readPackageJson();
  if (!pkg.version) {
    fail('package.json has no version');
  }
  return pkg.version;
}

function currentPackageName() {
  const pkg = readPackageJson();
  if (!pkg.name) {
    fail('package.json has no name');
  }
  return pkg.name;
}

function currentRepository() {
  const pkg = readPackageJson();
  return normalizeRepositoryUrl(pkg.repository);
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

function publishTag(tag, remote = 'origin') {
  ensureGitWorkspace();
  cp.execSync(`git push ${JSON.stringify(remote)} ${JSON.stringify(tag)}`, {
    stdio: 'inherit',
  });
}

module.exports = {
  currentRepoNode,
  currentPackageVersion,
  currentPackageName,
  currentRepository,
  readFile,
  writeFile,
  setTag,
  publishTag,
};
