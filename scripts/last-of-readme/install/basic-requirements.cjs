#!/usr/bin/env node

const {
  assertInGitRepository,
} = require('../adapters/git-adapter.cjs');
const {
  assertPackageManifestReadableByNpm,
} = require('../adapters/npm-adapter.cjs');

function checkCommonRequirements() {
  assertInGitRepository();
  assertPackageManifestReadableByNpm();
}

module.exports = {
  checkCommonRequirements,
};
