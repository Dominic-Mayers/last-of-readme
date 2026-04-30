#!/usr/bin/env node

const cp = require('child_process');
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
    run('git rev-parse --is-inside-work-tree');
  } catch {
    fail('Current directory is not a Git repository');
  }
}

function remoteName() {
  // TODO architecture:
  // This reads npm/package configuration to find a Git remote name. It is kept
  // here to preserve behavior while the tag publishing flow is separated into
  // explicit npm and git steps.
  const { getPackageJsonField } = require('./npm-adapter.cjs');
  const configuredRemoteName = getPackageJsonField('lastOfReadme.remoteName', {
    allowEmpty: true,
  });

  if (configuredRemoteName && typeof configuredRemoteName === 'string') {
    return configuredRemoteName;
  }

  fail('No Last of Readme remoteName configured in package.json');
}

module.exports = {
    assertInGitRepository,
    currentRepoNode,
    setTag,
    publishTag,
    getRemotesFromGit,
};
