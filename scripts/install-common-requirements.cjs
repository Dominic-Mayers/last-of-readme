#!/usr/bin/env node

const {
  currentWorkingDirectory,
  gitVersion,
  gitTopLevel,
} = require('./install-utils.cjs');

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

function checkCommonRequirements() {
  assertGitAvailable();
  assertInGitRepository();
  assertAtRepoRoot();
}

module.exports = {
  assertGitAvailable,
  assertInGitRepository,
  assertAtRepoRoot,
  checkCommonRequirements,
};
