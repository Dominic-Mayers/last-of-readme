#!/usr/bin/env node

const { configuredDocumentationContract } = require('./adapters/npm-adapter.cjs');

const SUPPORTED_CONTRACTS = new Set(['until-successor-of']);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  try {
    const contract = configuredDocumentationContract();

    if (!SUPPORTED_CONTRACTS.has(contract)) {
      fail(
        `Unsupported Last of Readme contract: ${contract}. ` +
        `Run "node scripts/last-of-readme/last-of-readme-contract.cjs until-successor-of".`
      );
    }
  } catch (err) {
    fail(
      (err && err.message ? err.message : String(err)) +
      '\n👉 Run "node scripts/last-of-readme/last-of-readme-contract.cjs until-successor-of" before bumping the version.\n'
    );
  }
}

main();
