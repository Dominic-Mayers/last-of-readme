#!/usr/bin/env node

const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');
const {
  commandEffect,
  commandFailed,
  commandMessage,
  commandSucceeded,
} = require('./core/command-result.cjs');

const ALLOWED_KINDS = new Set(['last-of', 'successor-of', 'correction-of']);
const MOVABLE_KINDS = new Set(['correction-of']);

function isKindCompatibleWithContract(kind, contract) {
  if (kind === 'correction-of') return contract === 'correction-of';
  return contract !== 'correction-of';
}

function parseTagDocArgs(args, ports) {
  const push = !args.includes('--no-push');
  const positional = args.filter((arg) => !arg.startsWith('--'));

  if (positional.length !== 1) {
    return commandFailed(ports.userInput.formatTagDocUsage(), {
      failureKind: 'invalid-tag-doc-arguments',
      data: { positional },
    });
  }

  const kind = positional[0];
  if (!ALLOWED_KINDS.has(kind)) {
    return commandFailed(ports.userInput.formatUnknownDocTagKind(kind), {
      failureKind: 'unknown-doc-tag-kind',
      data: { kind },
    });
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

async function runTagDocCommand({ args, ports }) {
  const parsed = parseTagDocArgs(args, ports);
  if (!parsed.ok) {
    return parsed;
  }

  try {
    const { kind, push } = parsed;
    const packageName = ports.npm.packageName();
    const published = await ports.registry.fetchPublishedLink(packageName);
    if (!published) {
      return commandFailed(
        new Error(`No resolver link found in published package '${packageName}'`),
        { failureKind: 'published-link-not-found' }
      );
    }
    const { version, contract } = published;
    const messages = [];
    const effects = [];

    if (!isKindCompatibleWithContract(kind, contract)) {
      messages.push(commandMessage('contract-kind-mismatch', { kind, contract }));
    }

    const tag = `v${version}-${kind}`;

    const movable = MOVABLE_KINDS.has(kind);
    const annotation = annotationFor(kind, version);

    if (movable) {
      ports.git.setMovableTagAtCurrentCommit(tag, annotation);
      messages.push(commandMessage('movable-tag-created', { tag }));
      effects.push(commandEffect('movable-tag-created', { tag, annotation }));
    } else {
      ports.git.setTagAtCurrentCommit(tag, annotation);
      messages.push(commandMessage('tag-created', { tag }));
      effects.push(commandEffect('tag-created', { tag, annotation }));
    }

    if (push) {
      const remote = ports.npm.configuredRemoteName();
      if (movable) {
        ports.git.publishMovableTag(tag, remote);
        messages.push(commandMessage('movable-tag-pushed', { tag, remote }));
        effects.push(commandEffect('movable-tag-pushed', { tag, remote }));
      } else {
        ports.git.publishTag(tag, remote);
        messages.push(commandMessage('tag-pushed', { tag, remote }));
        effects.push(commandEffect('tag-pushed', { tag, remote }));
      }
    } else {
      messages.push(commandMessage('tag-not-pushed'));
    }

    return commandSucceeded({
      changed: true,
      data: {
        tag,
        kind,
        movable,
        pushed: push,
      },
      messages,
      effects,
    });
  } catch (err) {
    return commandFailed(err, {
      failureKind: 'tag-doc-command-failed',
    });
  }
}

function printTagDocResult(result, ports) {
  if (!result.ok) {
    ports.userInput.printAbortMessage(result.message);
    return;
  }

  for (const message of result.messages || []) {
    if (message.kind === 'contract-kind-mismatch') {
      ports.userInput.printContractKindMismatchWarning(message.kind, message.contract);
    }
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

async function main() {
  const ports = createDefaultRuntimePorts();
  const result = await runTagDocCommand({
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
