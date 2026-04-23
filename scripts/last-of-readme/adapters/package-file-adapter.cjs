#!/usr/bin/env node

const fs = require('fs');

function assertExistingReadableWritableRegularFile(filePath) {
  const stats = fs.statSync(filePath);

  if (!stats.isFile()) {
    throw new Error(`${filePath} exists but is not a regular file`);
  }

  fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
}

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
