#!/usr/bin/env node

/**
 * Adapter over the local Git repository used by Last of Readme.
 *
 * The exported operations assume a Git executable and a local Git repository
 * context. These are checked during the installer basic requirements by
 * assertInGitRepository(). Runtime/core scripts that use this adapter have the
 * same environmental expectation, but do not inherit any process-state
 * guarantee from installation.
 *
 * Function-level comments describe each Git capability. Argument constraints
 * that affect Git command success are documented with @param tags rather than
 * as Last-of-Readme installation requirements.
 */

const cp = require('child_process');
const { execFileSync } = require('child_process');

const WORKSPACE_ROOT = process.cwd();

/**
 * Asserts the existence of a Git repository context for Git-backed
 * documentation operations.
 *
 * @remarks Simple environmental probe with no Last-of-Readme-specific
 * requirements.
 */
function assertInGitRepository() {
  try {
    gitVersion();
    gitDirectory();
  } catch (error) {
    throw new Error('Install must be run inside a Git repository');
  }
}

/**
 * Creates an annotated documentation tag at the current repository commit.
 *
 * @param {string} tag - Must not already exist in the local repository.
 * @param {string} annotation - Annotation message stored in the annotated tag.
 */
function setTagAtCurrentCommit(tag, annotation) {
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
    `git tag -a ${JSON.stringify(tag)} -m ${JSON.stringify(annotation)}`,
    { stdio: 'inherit' }
  );
}

/**
 * Publishes an existing documentation tag to a Git remote.
 *
 * @param {string} tag - Must identify an existing local tag.
 * @param {string} remote - Git remote to which the tag should be pushed.
 */
function publishTag(tag, remote) {
  ensureGitWorkspace();
  cp.execSync(`git push ${JSON.stringify(remote)} ${JSON.stringify(tag)}`, {
    stdio: 'inherit',
  });
}

/**
 * Lists local Git remotes that installation can offer as repository choices.
 */
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

module.exports = {
    assertInGitRepository,
    setTagAtCurrentCommit,
    publishTag,
    getRemotesFromGit,
};
