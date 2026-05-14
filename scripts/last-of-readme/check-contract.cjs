#!/usr/bin/env node

const { configuredNextDocumentationContract } = require('./adapters/npm-adapter.cjs');

const SUPPORTED_CONTRACTS = new Set(['until-successor-of', 'last-of', 'continuation-of', 'correction-of']);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  try {
    const contract = configuredNextDocumentationContract();

    if (!SUPPORTED_CONTRACTS.has(contract)) {
      fail(
        `Unsupported Last of Readme contract: "${contract}".\n\n` +
        `From the package root, run one of:\n` +
        `  npx last-of-readme contract until-successor-of\n` +
        `  npx last-of-readme contract last-of\n` +
        `  npx last-of-readme contract continuation-of\n` +
        `  npx last-of-readme contract correction-of\n\n` +
        `Then retry:\n` +
        `  npm version patch\n`
      );
    }
  } catch (err) {
    fail(
      (err && err.message ? err.message : String(err)) +
      '\n\nBefore bumping the version, choose the resolver contract for the next README link.\n\n' +
      'From the package root, run:\n' +
      '  npx last-of-readme contract until-successor-of\n\n' +
      'Then retry:\n' +
      '  npm version patch\n'
    );
  }
}

main();
