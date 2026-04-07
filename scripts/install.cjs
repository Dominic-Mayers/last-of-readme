#!/usr/bin/env node

const { checkCommonRequirements } = require ('./install-common-requirements.cjs');
const { collectUserInput } = require('./collect-user-input.cjs');
const {
  checkDocLinkRequirements,
  checkDocLinkPackageJsonRequirements,
  installDocLink,
  installDocLinkPackageJson,
} = require('./install-doc-link.cjs');

function checkRequirements(config) {
  checkDocLinkRequirements(config);
  checkDocLinkPackageJsonRequirements(config);
}

function automatedInstall(config) {
  installDocLink(config);
  installDocLinkPackageJson(config);
}

async function main() {
  checkCommonRequirements(); 
  console.log('✔ Common requirements satisfied');
  const session = await collectUserInput();
  checkRequirements(session.config);
  automatedInstall(session.config);
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`❌ ${message}`);
  process.exit(1);
});
