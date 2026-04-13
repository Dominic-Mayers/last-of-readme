#!/usr/bin/env node

const { installDocLink, installDocLinkPackageJson } = require('./doc-link.cjs');
const { installRemotePackageJson } = require('./remote.cjs');

function automatedInstall(config) {
  installDocLink(config);
  installRemotePackageJson(config);
  installDocLinkPackageJson(config);
}

module.exports = {
  automatedInstall,
};
