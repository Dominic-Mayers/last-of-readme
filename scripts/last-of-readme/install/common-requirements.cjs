#!/usr/bin/env node

const {
  assertGitAvailable,
  assertInGitRepository,
  assertAtRepoRoot,
  assertPackageManifestReadableByNpm,
} = require('../adapters/local-workspace-adapter.cjs');

function checkCommonRequirements() {
  assertGitAvailable();
  assertInGitRepository();
  assertAtRepoRoot();
  assertPackageManifestReadableByNpm();
}

module.exports = {
  checkCommonRequirements,
};
