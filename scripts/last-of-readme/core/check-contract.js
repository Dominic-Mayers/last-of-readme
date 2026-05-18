const SUPPORTED_CONTRACTS = new Set([
  'until-next',
  'until-next-warn',
  'until-branch',
  'until-branch-warn',
  'correction-of',
]);

function formatUnsupportedContractBeforeVersion(contract) {
  return (
    `Unsupported Last of Readme contract: "${contract}".\n\n` +
    `From the package root, run one of:\n` +
    `  npx last-of-readme contract until-next\n` +
    `  npx last-of-readme contract until-next-warn\n` +
    `  npx last-of-readme contract until-branch\n` +
    `  npx last-of-readme contract until-branch-warn\n` +
    `  npx last-of-readme contract correction-of\n\n` +
    `Then retry:\n` +
    `  npm version patch\n`
  );
}

function formatMissingContractBeforeVersion(error) {
  return (
    (error && error.message ? error.message : String(error)) +
    '\n\nBefore bumping the version, choose the resolver contract for the next README link.\n\n' +
    'From the package root, run:\n' +
    '  npx last-of-readme contract until-next\n\n' +
    'Then retry:\n' +
    '  npm version patch\n'
  );
}

function runCheckContract({ ports }) {
  const { commandEffect, commandFailed, commandMessage, commandSucceeded } = globalThis.LastOfReadmeCommandResult;
  try {
    const contract = ports.npm.configuredNextDocumentationContract();

    if (!SUPPORTED_CONTRACTS.has(contract)) {
      return commandFailed(formatUnsupportedContractBeforeVersion(contract), {
        failureKind: 'unsupported-contract-before-version',
        data: { contract },
      });
    }

    return commandSucceeded({
      data: { contract },
      messages: commandMessage('contract-supported', { contract }),
      effects: commandEffect('contract-read', { contract }),
    });
  } catch (err) {
    return commandFailed(formatMissingContractBeforeVersion(err), {
      failureKind: 'missing-contract-before-version',
    });
  }
}

globalThis.LastOfReadmeCheckContract = {
  SUPPORTED_CONTRACTS,
  formatMissingContractBeforeVersion,
  formatUnsupportedContractBeforeVersion,
  runCheckContract,
};
