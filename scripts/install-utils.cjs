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

module.exports = {
  currentWorkingDirectory,
  gitVersion,
  gitTopLevel,
};
