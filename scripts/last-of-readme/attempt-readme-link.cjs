#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');

runAttempt('update README resolver link', async () => {
  require('./update-readme-link.cjs');
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
