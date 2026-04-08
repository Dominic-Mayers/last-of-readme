#!/usr/bin/env node

const fs = require('fs');
const { execFileSync } = require('child_process');

function currentWorkingDirectory() {
  return fs.realpathSync(process.cwd());
}

function gitVersion() {
  return execFileSync('git', ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitTopLevel() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitRemoteNames() {
  const output = execFileSync('git', ['remote'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitRemoteUrl(remoteName) {
  return execFileSync('git', ['remote', 'get-url', remoteName], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function normalizeGitHubRepository(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('A GitHub remote URL is required');
  }

  let normalized = url.trim();

  if (normalized.startsWith('git+')) {
    normalized = normalized.slice(4);
  }

  if (normalized.endsWith('.git')) {
    normalized = normalized.slice(0, -4);
  }

  let match = normalized.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)$/);
  if (match) {
    return match[1];
  }

  match = normalized.match(/^git@github\.com:([^/]+\/[^/]+)$/);
  if (match) {
    return match[1];
  }

  throw new Error('Remote URL must point to a GitHub repository');
}

module.exports = {
  currentWorkingDirectory,
  gitVersion,
  gitTopLevel,
  gitRemoteNames,
  gitRemoteUrl,
  normalizeGitHubRepository,
};
