const SUPPORTED_CONTRACTS = new Set([
  'until-next',
  'until-next-warn',
  'until-branch',
  'until-branch-warn',
  'correction-of',
]);

async function runContractCommand({ args, ports }) {
  const { commandEffect, commandFailed, commandMessage, commandSucceeded } = globalThis.LastOfReadmeCommandResult;
  const contract = args[0];

  if (!contract) {
    return commandFailed(ports.userInput.formatContractUsage(), {
      failureKind: 'missing-contract-argument',
    });
  }

  if (!SUPPORTED_CONTRACTS.has(contract)) {
    return commandFailed(ports.userInput.formatUnsupportedContract(contract), {
      failureKind: 'unsupported-contract',
      data: { contract },
    });
  }

  try {
    const documentationPath = ports.npm.packageFilePath();
    const confirmed = await ports.userInput.askDocumentationContractConfirmation({
      contract,
      documentationPath,
    });

    if (!confirmed) {
      return commandSucceeded({
        changed: false,
        data: { contract },
        messages: commandMessage('no-changes'),
      });
    }

    const fields = { 'lastOfReadme.nextContract': contract };
    ports.npm.updatePackageJsonFields(fields);

    return commandSucceeded({
      changed: true,
      data: { contract },
      messages: commandMessage('next-contract-set', { contract }),
      effects: commandEffect('package-json-fields-updated', { fields }),
    });
  } catch (err) {
    return commandFailed(err, {
      failureKind: 'contract-command-failed',
    });
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

globalThis.LastOfReadmeContract = {
  SUPPORTED_CONTRACTS,
  printContractResult,
  runContractCommand,
};
