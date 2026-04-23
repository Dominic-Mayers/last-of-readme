#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
function normalizeGitHubRemote(remoteUrl) {
  const httpsMatch = String(remoteUrl).match(
    /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i
  );

  if (httpsMatch) {
    const host = httpsMatch[1];
    const owner = httpsMatch[2];
    const repo = httpsMatch[3];

    return {
      kind: host.toLowerCase() === 'github.com' ? 'github' : 'github-enterprise',
      host,
      repository: `${owner}/${repo}`,
    };
  }

  const sshMatch = String(remoteUrl).match(
    /^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/i
  );

  if (sshMatch) {
    const host = sshMatch[1];
    const owner = sshMatch[2];
    const repo = sshMatch[3];

    return {
      kind: host.toLowerCase() === 'github.com' ? 'github' : 'github-enterprise',
      host,
      repository: `${owner}/${repo}`,
    };
  }

  throw new Error(`Unsupported remote URL: ${remoteUrl}`);
}

function normalizePackageFilePath(packageFilePath) {
  const normalized = normalizeOptionalText(packageFilePath);

  if (!normalized) {
    throw new Error('packageFilePath is required');
  }

  return path.normalize(normalized);
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function assertExistingReadableWritableRegularFile(filePath) {
  const stats = fs.statSync(filePath);

  if (!stats.isFile()) {
    throw new Error(`${filePath} exists but is not a regular file`);
  }

  fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
}

module.exports = {
  assertExistingReadableWritableRegularFile,
  normalizeGitHubRemote,
  normalizePackageFilePath,
  normalizeOptionalText,
};
