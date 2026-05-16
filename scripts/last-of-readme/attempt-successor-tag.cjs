#!/usr/bin/env node

const { runAttempt } = require('./attempt-utils.cjs');
const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');
const { START_MARKER, END_MARKER } = require('./update-readme-link.cjs');

function previousVersionHadLink(ports) {
  const filePath = ports.npm.packageFilePath();
  const content = ports.filesystem.readPackageFileContent(filePath);
  const si = content.indexOf(START_MARKER);
  const ei = si !== -1 ? content.indexOf(END_MARKER, si + START_MARKER.length) : -1;
  return si !== -1 && ei !== -1 && content.slice(si + START_MARKER.length, ei).trim().length > 0;
}

runAttempt('add successor-of tag', async () => {
  const ports = createDefaultRuntimePorts();
  if (!previousVersionHadLink(ports)) {
    return;
  }

  process.argv = [
    ...process.argv.slice(0, 2),
    'successor-of',
  ];

  require('./tag-doc.cjs');
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
