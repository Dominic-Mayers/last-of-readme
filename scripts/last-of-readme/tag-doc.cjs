#!/usr/bin/env node

const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');

const ALLOWED_KINDS = new Set(['last-of', 'successor-of', 'correction-of']);
const MOVABLE_KINDS = new Set(['correction-of']);

function makeFailure(message) {
  return {
    ok: false,
    message,
  };
}

function parseTagDocArgs(args, ports) {
  const push = !args.includes('--no-push');
  const positional = args.filter((arg) => !arg.startsWith('--'));

  if (positional.length !== 1) {
    return makeFailure(ports.userInput.formatTagDocUsage());
  }

  const kind = positional[0];
  if (!ALLOWED_KINDS.has(kind)) {
    return makeFailure(ports.userInput.formatUnknownDocTagKind(kind));
  }

  return {
    ok: true,
    kind,
    push,
  };
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

function runTagDocCommand({ args, ports }) {
  const parsed = parseTagDocArgs(args, ports);
  if (!parsed.ok) {
    return parsed;
  }

  try {
    const { kind, push } = parsed;
    const version = ports.npm.currentPackageVersion();
    const tag = `v${version}-${kind}`;

    const movable = MOVABLE_KINDS.has(kind);
    const annotation = annotationFor(kind, version);
    const messages = [];

    if (movable) {
      ports.git.setMovableTagAtCurrentCommit(tag, annotation);
      messages.push({ kind: 'movable-tag-created', tag });
    } else {
      ports.git.setTagAtCurrentCommit(tag, annotation);
      messages.push({ kind: 'tag-created', tag });
    }

    if (push) {
      const remote = ports.npm.configuredRemoteName();
      if (movable) {
        ports.git.publishMovableTag(tag, remote);
        messages.push({ kind: 'movable-tag-pushed', tag, remote });
      } else {
        ports.git.publishTag(tag, remote);
        messages.push({ kind: 'tag-pushed', tag, remote });
      }
    } else {
      messages.push({ kind: 'tag-not-pushed' });
    }

    return {
      ok: true,
      tag,
      kind,
      movable,
      pushed: push,
      messages,
    };
  } catch (err) {
    return makeFailure(err && err.message ? err.message : String(err));
  }
}

function printTagDocResult(result, ports) {
  if (!result.ok) {
    ports.userInput.printAbortMessage(result.message);
    return;
  }

  for (const message of result.messages || []) {
    if (message.kind === 'movable-tag-created') {
      ports.userInput.printMovableTagCreated(message.tag);
    }
    if (message.kind === 'tag-created') {
      ports.userInput.printTagCreated(message.tag);
    }
    if (message.kind === 'movable-tag-pushed') {
      ports.userInput.printMovableTagPushed(message.tag);
    }
    if (message.kind === 'tag-pushed') {
      ports.userInput.printTagPushed(message.tag);
    }
    if (message.kind === 'tag-not-pushed') {
      ports.userInput.printTagNotPushed();
    }
  }
}

function main() {
  const ports = createDefaultRuntimePorts();
  const result = runTagDocCommand({
    args: process.argv.slice(2),
    ports,
  });

  printTagDocResult(result, ports);

  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED_KINDS,
  MOVABLE_KINDS,
  annotationFor,
  parseTagDocArgs,
  printTagDocResult,
  runTagDocCommand,
};
