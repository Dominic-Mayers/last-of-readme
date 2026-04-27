#!/usr/bin/env node

const {
  assertInGitRepository,
  assertCwdIsPackageRoot,
  assertPackageManifestReadableByNpm,
} = require('../adapters/local-workspace-adapter.cjs');

function checkCommonRequirements() {
  assertInGitRepository();
  assertCwdIsPackageRoot();
  assertPackageManifestReadableByNpm();
}

module.exports = {
  checkCommonRequirements,
};
