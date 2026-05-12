#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');

runAttempt('add successor-of tag', async () => {
  process.argv = [
    ...process.argv.slice(0, 2),
    'successor-of',
  ];

  require('./tag-doc.cjs');
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
