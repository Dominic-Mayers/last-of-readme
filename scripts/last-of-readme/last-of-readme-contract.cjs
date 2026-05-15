#!/usr/bin/env node

const { createDefaultRuntimePorts } = require('./ports/default-runtime-ports.cjs');

const SUPPORTED_CONTRACTS = new Set([
  'until-next',
  'until-next-warn',
  'until-branch',
  'until-branch-warn',
  'correction-of',
]);

function makeFailure(message) {
  return {
    ok: false,
    message,
  };
}

async function runContractCommand({ args, ports }) {
  const contract = args[0];

  if (!contract) {
    return makeFailure(ports.userInput.formatContractUsage());
  }

  if (!SUPPORTED_CONTRACTS.has(contract)) {
    return makeFailure(ports.userInput.formatUnsupportedContract(contract));
  }

  try {
    const documentationPath = ports.npm.packageFilePath();
    const confirmed = await ports.userInput.askDocumentationContractConfirmation({
      contract,
      documentationPath,
    });

    if (!confirmed) {
      return {
        ok: true,
        changed: false,
        messages: [
          {
            kind: 'no-changes',
          },
        ],
      };
    }

    ports.npm.updatePackageJsonFields({ 'lastOfReadme.nextContract': contract });

    return {
      ok: true,
      changed: true,
      contract,
      messages: [
        {
          kind: 'next-contract-set',
          contract,
        },
      ],
    };
  } catch (err) {
    return makeFailure(err && err.message ? err.message : String(err));
  }
}

function printContractResult(result, ports) {
  if (!result.ok) {
    ports.userInput.printAbortMessage(result.message);
    return;
  }

  for (const message of result.messages || []) {
    if (message.kind === 'no-changes') {
      ports.userInput.printNoChangesMade();
    }
    if (message.kind === 'next-contract-set') {
      ports.userInput.printNextContractSet(message.contract);
    }
  }
}

async function main() {
  const ports = createDefaultRuntimePorts();
  const result = await runContractCommand({
    args: process.argv.slice(2),
    ports,
  });

  printContractResult(result, ports);

  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SUPPORTED_CONTRACTS,
  printContractResult,
  runContractCommand,
};
