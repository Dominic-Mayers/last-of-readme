#!/usr/bin/env node

const {
  assertExistingReadableWritableRegularFile,
} = require('../install/utils.cjs');

// Boundary-level requirement check used by installer phase logic.
// It delegates to the lower-level file check but throws in run-time
// requirement terms rather than local operational terms.
function validateExistingPackageFile(packageFilePath) {
  try {
    assertExistingReadableWritableRegularFile(packageFilePath);
  } catch (error) {
    throw new Error(
      `${packageFilePath} must be an existing regular file readable and writable for Last of Readme to run`
    );
  }
}

module.exports = {
  validateExistingPackageFile,
  assertExistingReadableWritableRegularFile,
};
