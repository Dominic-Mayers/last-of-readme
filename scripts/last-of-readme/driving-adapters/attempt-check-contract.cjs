#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');

runAttempt('check contract', async () => {
  require('./check-contract.cjs');
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
