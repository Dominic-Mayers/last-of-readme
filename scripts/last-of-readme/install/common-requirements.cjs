#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  currentWorkingDirectory,
  gitVersion,
  gitTopLevel,
} = require('./utils.cjs');

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

function getPackageJsonPath() {
  return path.resolve(currentWorkingDirectory(), 'package.json');
}

function assertPackageJsonInstalled() {
  const packageJsonPath = getPackageJsonPath();

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json must exist at the repository root');
  }

  try {
    execFileSync('npm', ['pkg', 'get', 'version'], {
      cwd: currentWorkingDirectory(),
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

function checkCommonRequirements() {
  assertGitAvailable();
  assertInGitRepository();
  assertAtRepoRoot();
  assertPackageJsonInstalled();
}

module.exports = {
  assertGitAvailable,
  assertInGitRepository,
  assertAtRepoRoot,
  assertPackageJsonInstalled,
  checkCommonRequirements,
};
