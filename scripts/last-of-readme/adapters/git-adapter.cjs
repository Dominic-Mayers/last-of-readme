#!/usr/bin/env node

const { execFileSync } = require('child_process');

const WORKSPACE_ROOT = process.cwd();

/**
 * Checks that installation runs inside a Git repository.
 *
 * Last of Readme needs a repository context to:
 *   - list and select remotes, which determine where the GitHub README is displayed
 *   - read the current commit when tagging documentation
 *   - create and publish documentation tags
 */
function assertInGitRepository() {
  try {
    gitVersion();
    gitDirectory();
  } catch (error) {
    throw new Error('Install must be run inside a Git repository');
  }
}

function currentRepoNode() {
  ensureGitWorkspace();
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function setTag(tag, repoNode, annotation) {
  ensureGitWorkspace();

  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], {
      cwd: WORKSPACE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    fail(`Tag already exists: ${tag}`);
  } catch (err) {
    if (err.isWorkspaceApiError) {
      throw err;
    }
  }

  execFileSync('git', ['tag', '-a', tag, repoNode, '-m', annotation], {
    cwd: WORKSPACE_ROOT,
    stdio: 'inherit',
  });
}

function publishTag(tag, remote) {
  ensureGitWorkspace();
  execFileSync('git', ['push', remote, tag], {
    cwd: WORKSPACE_ROOT,
    stdio: 'inherit',
  });
}

function getRemotesFromGit() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}

function fail(message) {
  const error = new Error(message);
  error.isWorkspaceApiError = true;
  throw error;
}

function gitVersion() {
  return execFileSync('git', ['--version'], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
}

function gitDirectory() {
  return execFileSync('git', ['rev-parse', '--git-dir'], {
    cwd: WORKSPACE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();
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
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: WORKSPACE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch {
    fail('Current directory is not a Git repository');
  }
}

module.exports = {
    assertInGitRepository,
    currentRepoNode,
    setTag,
    publishTag,
    getRemotesFromGit,
};
