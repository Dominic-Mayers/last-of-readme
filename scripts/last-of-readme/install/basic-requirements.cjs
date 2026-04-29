#!/usr/bin/env node

const {
  assertInGitRepository,
  assertPackageManifestReadableByNpm,
} = require('../adapters/local-workspace-adapter.cjs');

function checkCommonRequirements() {
  assertInGitRepository();
  assertPackageManifestReadableByNpm();
}

module.exports = {
  checkCommonRequirements,
};
