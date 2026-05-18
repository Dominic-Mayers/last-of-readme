#!/usr/bin/env node

const {
  assertInGitRepository,
} = require('../driven-adapters/git-adapter.cjs');
const {
  assertPackageManifestReadableByNpm,
} = require('../driven-adapters/npm-adapter.cjs');

function checkBasicRequirements() {
  assertInGitRepository();
  assertPackageManifestReadableByNpm();
}

module.exports = {
  checkBasicRequirements,
};
