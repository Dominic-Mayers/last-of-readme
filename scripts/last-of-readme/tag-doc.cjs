#!/usr/bin/env node

const { 
    currentPackageVersion,
    configuredRemoteName
} = require('./adapters/npm-adapter.cjs');

const { 
    setTagAtCurrentCommit,
    publishTag
} = require('./adapters/git-adapter.cjs');

const ALLOWED_KINDS = new Set(['last-doc', 'next-doc']);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const push = !args.includes('--no-push');
  const positional = args.filter((arg) => !arg.startsWith('--'));

  if (positional.length !== 1) {
    fail('Usage: node tag-doc.cjs <last-doc|next-doc> [--no-push]');
  }

  const kind = positional[0];
  if (!ALLOWED_KINDS.has(kind)) {
    fail(`Unknown doc tag kind: ${kind}`);
  }

  return { kind, push };
}

function annotationFor(kind, version) {
  if (kind === 'last-doc') {
    return `Last README commit for version ${version}`;
  }
  return `Next README anchor for version ${version}`;
}

function main() {
  try {
    const { kind, push } = parseArgs(process.argv);
    const version = currentPackageVersion();
    const tag = `v${version}-${kind}`;

    setTagAtCurrentCommit(tag, annotationFor(kind, version));
    console.log(`✅ Created tag ${tag}`);

    if (push) {
      const remote = configuredRemoteName(); 
      publishTag(tag, remote);
      console.log(`✅ Pushed tag ${tag}`);
    } else {
      console.log('ℹ️ Tag not pushed');
    }
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
