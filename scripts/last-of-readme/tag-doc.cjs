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

const {
  formatTagDocUsage,
  formatUnknownDocTagKind,
  printAbortMessage,
  printMovableTagCreated,
  printMovableTagPushed,
  printTagCreated,
  printTagNotPushed,
  printTagPushed,
} = require('./adapters/prompt-user-input.cjs');

const ALLOWED_KINDS = new Set(['last-of', 'successor-of', 'correction-of']);
const MOVABLE_KINDS = new Set(['correction-of']);

function fail(message) {
  printAbortMessage(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const push = !args.includes('--no-push');
  const positional = args.filter((arg) => !arg.startsWith('--'));

  if (positional.length !== 1) {
    fail(formatTagDocUsage());
  }

  const kind = positional[0];
  if (!ALLOWED_KINDS.has(kind)) {
    fail(formatUnknownDocTagKind(kind));
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
      printMovableTagCreated(tag);
    } else {
      setTagAtCurrentCommit(tag, annotation);
      printTagCreated(tag);
    }

    if (push) {
      const remote = configuredRemoteName();
      if (movable) {
        publishMovableTag(tag, remote);
        printMovableTagPushed(tag);
      } else {
        publishTag(tag, remote);
        printTagPushed(tag);
      }
    } else {
      printTagNotPushed();
    }
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
