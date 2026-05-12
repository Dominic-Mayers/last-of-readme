#!/usr/bin/env node

const {
  applyInstallationRemainder,
  remindAboutConvenienceHooks,
} = require('./apply-installation.cjs');
const {
  installOwnedVersionHooks,
} = require('./install-owned-version-hooks.cjs');

async function runInstallationPerSe(pipelineState = {}) {
  pipelineState = await applyInstallationRemainder(pipelineState);
  pipelineState = await installOwnedVersionHooks(pipelineState);
  remindAboutConvenienceHooks(pipelineState);
}

module.exports = {
  runInstallationPerSe,
};
