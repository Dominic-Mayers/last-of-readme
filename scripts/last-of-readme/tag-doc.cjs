#!/usr/bin/env node

const { 
    currentPackageVersion,
    configuredRemoteName
} = require('./adapters/npm-adapter.cjs');

const { 
    setTagAtCurrentCommit,
    setMovableTagAtCurrentCommit,
    publishTag,
    publishMovableTag
} = require('./adapters/git-adapter.cjs');

const ALLOWED_KINDS = new Set(['last-of', 'successor-of', 'correction-of']);
const MOVABLE_KINDS = new Set(['correction-of']);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const push = !args.includes('--no-push');
  const positional = args.filter((arg) => !arg.startsWith('--'));

  if (positional.length !== 1) {
    fail('Usage: node tag-doc.cjs <last-of|successor-of|correction-of> [--no-push]');
  }

  const kind = positional[0];
  if (!ALLOWED_KINDS.has(kind)) {
    fail(`Unknown doc tag kind: ${kind}`);
  }

  return { kind, push };
}

function annotationFor(kind, version) {
  if (kind === 'last-of') {
    return `Last README commit for version ${version}`;
  }
  if (kind === 'correction-of') {
    return `Corrected README commit for version ${version}`;
  }
  return `Successor README anchor for version ${version}`;
}

function main() {
  try {
    const { kind, push } = parseArgs(process.argv);
    const version = currentPackageVersion();
    const tag = `v${version}-${kind}`;

    const movable = MOVABLE_KINDS.has(kind);
    const annotation = annotationFor(kind, version);

    if (movable) {
      setMovableTagAtCurrentCommit(tag, annotation);
      console.log(`✅ Created or replaced tag ${tag}`);
    } else {
      setTagAtCurrentCommit(tag, annotation);
      console.log(`✅ Created tag ${tag}`);
    }

    if (push) {
      const remote = configuredRemoteName(); 
      if (movable) {
        publishMovableTag(tag, remote);
        console.log(`✅ Pushed or replaced tag ${tag}`);
      } else {
        publishTag(tag, remote);
        console.log(`✅ Pushed tag ${tag}`);
      }
    } else {
      console.log('ℹ️ Tag not pushed');
    }
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
