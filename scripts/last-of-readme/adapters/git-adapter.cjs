#!/usr/bin/env node

/**
 * Adapter over the local Git repository used by Last of Readme.
 *
 * @assertRequirement A Git executable and a local Git repository context must be
 * available to Git-backed installer and runtime operations. Asserted in
 * assertInGitRepository().
 */

const { execFileSync } = require('child_process');

const WORKSPACE_ROOT = process.cwd();

/**
 * Asserts the basic Git environment needed by the installer before Git-backed
 * phases such as checkGitRemote() run.
 *
 * @returns {void}
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
 * Creates the documentation tag requested by tag-doc.cjs at the current
 * repository commit.
 *
 * @param {string} tag - Git tag name. Must be valid as refs/tags/<tag> and
 * must not already exist in the local repository.
 * @param {string} annotation - Annotation message stored in the annotated tag.
 * @remarks Requires a current commit at runtime.
 * @returns {void}
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
 * Publish a documentation tag to the configured remote. Used by tag-doc.cjs.
 *
 * @param {string} remoteName - The configured Git remote to publish to.
 * @param {string} tagName - The documentation tag to publish.
 * @returns {void}
 *
 * @configRequirement The remote name supplied at runtime must be installed as
 * Last of Readme package configuration. Configured in installRemotePackageJson().
 *
 * @assertRequirement The configured remote must accept tag publication.
 * Checked during installation by assertCanDryRunPublishTag().
 *
 * @remarks The actual push is still subject to runtime Git, network,
 * authentication, and remote-state failures.
 */
function publishTag(tag, remote) {
  ensureGitWorkspace();
  execFileSync('git', ['push', remote, tag], {
    cwd: WORKSPACE_ROOT,
    stdio: 'inherit',
  });
}

/**
 * Collects the local Git remotes used by collectGitRemotesEnvironmentInput()
 * before checkGitRemote() asks the user to select the Last of Readme remote.
 *
 * @returns {{name: string, url: string}[]} Local Git remotes available for
 * remote-selection prompts.
 */
function getRemotesFromGit() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}


/**
 * Asserts the selected remote publication capability used by
 * checkGitRemoteRequirements() before the remote configuration is finalized.
 *
 * @param {string} remote - Git remote to probe for tag publication.
 * @assertRequirement The selected Git remote must accept dry-run tag publication.
 * Asserted in checkGitRemoteRequirements().
 * @remarks Requires a current commit at installation time.
 * @returns {void}
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
      }/**
 * Reassert that the current working directory is inside a Git work tree.
 */
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

/**
 * Reassert that the current working directory is inside a Git work tree.
 */
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
