#!/usr/bin/env node

const { runNpmPkg } = require('../runNpmPkg.cjs'); 
const { installDocLink, installDocLinkPackageJson } = require('./doc-link.cjs');

function automatedInstall(config) {
  installDocLink(config);
  installRemotePackageJson(config);
  installDocLinkPackageJson(config);
}

function setPackageJsonFields(updates) {
  const assignments = Object.entries(updates).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`
  );

  runNpmPkg(
    ['set', '--json', ...assignments],  
    {
      allowEmpty: true,
      failureMessage: 'Could not update package.json',
    }
  );
}

function installRemotePackageJson(config = {}) {
  const remote = config.remote;

  if (!remote || !remote.localName || !remote.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.remoteName': remote.localName,
    'lastOfReadme.remote.kind': remote.kind,
    'lastOfReadme.remote.host': remote.host,
    'lastOfReadme.remote.repository': remote.repository,
  });

  return {
    path: 'package.json',
    remote: {
      localName: remote.localName,
      kind: remote.kind,
      host: remote.host,
      repository: remote.repository,
    },
  };
}

module.exports = {
  automatedInstall,
};
