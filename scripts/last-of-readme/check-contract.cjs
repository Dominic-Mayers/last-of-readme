#!/usr/bin/env node

const { configuredNextDocumentationContract } = require('./adapters/npm-adapter.cjs');

const SUPPORTED_CONTRACTS = new Set(['until-successor-of', 'last-of', 'correction-of']);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  try {
    const contract = configuredNextDocumentationContract();

    if (!SUPPORTED_CONTRACTS.has(contract)) {
      fail(
        `Unsupported Last of Readme contract: ${contract}. ` +
        `Run "last-of-readme contract until-successor-of" or ` +
        `"last-of-readme contract last-of" or ` +
        `"last-of-readme contract correction-of".`
      );
    }
  } catch (err) {
    fail(
      (err && err.message ? err.message : String(err)) +
      '\n👉 Run "last-of-readme contract until-successor-of" before bumping the version.\n'
    );
  }
}

main();
