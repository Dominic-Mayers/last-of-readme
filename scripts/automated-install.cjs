#!/usr/bin/env node

const { installDocLink, installDocLinkPackageJson } = require('./install-doc-link.cjs');
const { installRemotePackageJson } = require('./install-remote.cjs');

function automatedInstall(config) {
  installDocLink(config);
  installRemotePackageJson(config);
  installDocLinkPackageJson(config);
}

module.exports = {
  automatedInstall,
};
