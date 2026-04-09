#!/usr/bin/env node

const { installRemotePackageJson } = require('./install_remote.cjs');
const {
  installDocLink,
  installDocLinkPackageJson,
} = require('./install-doc-link.cjs');

function automatedInstall(config) {
  installDocLink(config);
  installRemotePackageJson(config);
  installDocLinkPackageJson(config);
}

module.exports = {
  automatedInstall,
};
