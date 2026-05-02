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
 * @remarks Git repository must contain a current commit.
 */
function setTagAtCurrentCommit(tag, annotation) {
  ensureGitWorkspace();
  ensureCurrentCommitExists();
  
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

  execFileSync('git', ['tag', '-a', tag, '-m', annotation], {
    cwd: WORKSPACE_ROOT,
    stdio: 'inherit',
  });
}

/**
 * Publishes an existing documentation tag to a Git remote.
 *
 * @param {string} tag - Must identify an existing local tag.
 * @param {string} remote - Git remote to which the tag should be pushed.
 * @remarks The configured runtime remote name must resolve to a Git remote that can accept tag pushes.
 */
function publishTag(tag, remote) {
  ensureGitWorkspace();
  execFileSync('git', ['push', remote, tag], {
    cwd: WORKSPACE_ROOT,
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


/**
 * Verifies that a Git remote accepts dry-run publication of a documentation
 * tag.
 *
 * @param {string} remote - Git remote to probe for tag publication.
 */
function assertCanDryRunPublishTag(remote) {
  ensureGitWorkspace();
  ensureCurrentCommitExists();

  try {
    execFileSync(
      'git',
      ['push', remote, 'HEAD:refs/tags/last-of-readme-install-probe', '--dry-run'],
      {
        cwd: WORKSPACE_ROOT,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );
  } catch (error) {
    fail(
      `Selected Git remote cannot dry-run publish tags: ${remote}` +
        commandErrorDetail(error)
    );
  }
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

function ensureCurrentCommitExists() {
  try {
    execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: WORKSPACE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch {
    fail('Git repository has no current commit');
  }
}

function commandErrorDetail(error) {
  const stderr = error && error.stderr ? String(error.stderr).trim() : '';
  return stderr ? `\n${stderr}` : '';
}

module.exports = {
    assertInGitRepository,
    setTagAtCurrentCommit,
    publishTag,
    getRemotesFromGit,
    assertCanDryRunPublishTag,
};
