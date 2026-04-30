#!/usr/bin/env node

const {
  assertInGitRepository,
} = require('../adapters/git-adapter.cjs');
const {
  assertPackageManifestReadableByNpm,
} = require('../adapters/npm-adapter.cjs');

function checkBasicRequirements() {
  assertInGitRepository();
  assertPackageManifestReadableByNpm();
}

module.exports = {
  checkBasicRequirements,
};
