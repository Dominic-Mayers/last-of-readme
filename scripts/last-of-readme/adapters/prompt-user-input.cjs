#!/usr/bin/env node

async function askRemoteChoice({
  askQuestion,
  remotes,
  defaultRemoteName,
}) {
  console.log('Git remotes:');
  console.log(formatRemoteChoices(remotes));
  console.log('Select a remote by number or by name. Enter none to stop.');

  const question = defaultRemoteName
    ? `Remote to use for Last of Readme [${defaultRemoteName}]: `
    : 'Remote to use for Last of Readme: ';

  return askQuestion(question);
}


async function askRepositoryApiUrl({
  askQuestion,
  defaultRepositoryApiUrl,
}) {
  const question = defaultRepositoryApiUrl
    ? `Repository API URL [${defaultRepositoryApiUrl}]: `
    : 'Repository API URL: ';

  return askQuestion(question);
}

async function askRepositoryBrowserUrl({
  askQuestion,
  defaultRepositoryBrowserUrl,
}) {
  const question = defaultRepositoryBrowserUrl
    ? `Repository browser URL [${defaultRepositoryBrowserUrl}]: `
    : 'Repository browser URL: ';

  return askQuestion(question);
}

async function askPackageFilePath({
  askQuestion,
  defaultPackageFilePath,
}) {
  return askQuestion(
    `Package file to update [${defaultPackageFilePath}]: `
  );
}

function showRepositoryUrlPathInformation() {
  console.log(`
ℹ️ Using the repository URL without a path.

GitHub uses specific rules to select which README to display at such URLs.

To avoid a collision with your package README.md,
you can place a separate GitHub README at:
  .github/README.md

Learn more:
  https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
`);
}

async function askRepositoryUrlPath({
  askQuestion,
  defaultRepositoryUrlPath,
  shouldShowRepositoryUrlPathInformationForAnswer,
}) {
  const question = defaultRepositoryUrlPath
    ? `Repository URL path to open after resolution [${defaultRepositoryUrlPath}]: `
    : 'Repository URL path to open after resolution (empty for the repository URL without a path): ';

  const answer = await askQuestion(question);

  if (shouldShowRepositoryUrlPathInformationForAnswer(answer)) {
    showRepositoryUrlPathInformation();
  }

  return answer;
}

async function askRemovePreviousPackageFile({
  askQuestion,
  previousPackageFilePath,
}) {
  return askQuestion(
    `Remove previous package file ${previousPackageFilePath} from package.json.files? [no]: `
  );
}

function printMissingPackageFileInformation(packageFilePath) {
  console.log(`
ℹ️ ${packageFilePath} does not exist.`);
}

async function askCreateMinimalPackageFile({ askQuestion }) {
  return askQuestion('Create a minimal package file? [no]: ');
}


function formatExistingInstallationDetails(details) {
  const lines = [];
  if (details.hasLastOfReadmeField) {
    lines.push('  - lastOfReadme field in package.json');
  }
  for (const hook of details.hooksWithInstallation) {
    lines.push(`  - ${hook} scripts hook references scripts/last-of-readme/`);
  }
  return lines.join('\n');
}

/**
 * Presents a unified summary of installation preconditions and asks the user
 * to proceed or abort. Shows:
 * - Existing installation details (if any).
 * - Convenience commands that Last of Readme needs in version/postversion hooks.
 * Then asks once whether to proceed.
 *
 * @param {object} params
 * @param {Function} params.askQuestion
 * @param {{ hasLastOfReadmeField: boolean, hooksWithInstallation: string[] } | null} params.existingInstallation
 * @param {{ hook: string, command: string, needs: string }[]} params.convenienceNeeds
 * @returns {Promise<string>} The user's answer.
 */
async function askInstallationPreconditions({
  askQuestion,
  existingInstallation,
  convenienceNeeds,
}) {
  console.log('');

  if (existingInstallation) {
    console.log('⚠️  An existing Last of Readme installation was detected:');
    console.log(formatExistingInstallationDetails(existingInstallation));
    console.log('Proceeding will overwrite the existing installation.');
    console.log('');
  }

  if (convenienceNeeds.length > 0) {
    console.log('ℹ️  Last of Readme also has the following needs in your scripts hooks:');
    for (const need of convenienceNeeds) {
      const { needs } = getConvenienceNeedText(need);
      console.log(`\n  ${need.hook}:`);
      console.log(`    ${needs}`);
      console.log(`    Command: ${need.command}`);
    }
    console.log('\nIf you proceed, Last of Readme will remind you to ensure these');
    console.log('commands are executed, either automatically or manually.');
    console.log('');
  }

  return askQuestion('Proceed with installation? [no]: ');
}


function formatRemoteChoices(remotes) {
  if (remotes.length === 0) {
    return '  (no Git remotes found)';
  }

  return remotes
    .map(({ name, url }, index) => `  ${index + 1}. ${name} (${url})`)
    .join('\n');
}

const CONVENIENCE_NEED_TEXT = {
  stagePackageFileBeforeVersionCommit: {
    needs:
      'The updated package file must be staged before the version commit is created. Otherwise the commit will not include the updated file.',
    insure: ({ command }) =>
      `Please ensure that ${command} is executed in your version hook, either automatically or manually.`,
  },
  pushTagsAfterVersion: {
    needs:
      'Last of Readme tags are not pushed to the remote automatically. Without them, the Last of Readme resolver will not work.',
    insure: ({ command }) =>
      `Please ensure that ${command} is executed in your postversion hook, either automatically or manually.`,
  },
};

function getConvenienceNeedText(need) {
  const text = CONVENIENCE_NEED_TEXT[need.kind];

  if (!text) {
    throw new Error(`Unknown convenience need kind: ${need.kind}`);
  }

  return {
    needs: text.needs,
    insure: text.insure(need),
  };
}

function getFingerprintedHookNeedText(hook) {
  if (hook === 'preversion') {
    return {
      needs:
        'The documentation contract must be checked and the successor tag must be set before the version is bumped. Without this, the Last of Readme resolver will not have the information it needs.',
      insure: ({ command }) =>
        `You can add the following command to your preversion hook:\n  ${command}`,
    };
  }

  if (hook === 'version') {
    return {
      needs:
        'The README link must be updated before the version commit is created. Otherwise the published README will point to the wrong commit.',
      insure: ({ command }) =>
        `You can add the following command to your version hook:\n  ${command}`,
    };
  }

  throw new Error(`Unknown fingerprinted hook: ${hook}`);
}

function printFingerprintedHookInstalled(hook) {
  console.log(`✔ ${hook}: Last of Readme command installed.`);
}

function printFingerprintedHookPrepended(hook) {
  console.log(`✔ ${hook}: Last of Readme command prepended.`);
}

function printConvenienceHookReminder(need) {
  const { insure } = getConvenienceNeedText(need);
  console.log(`\nℹ️  ${need.hook}: ${insure}`);
}

/**
 * Presents a fingerprinted hook installation decision.
 *
 * @param {object} params
 * @param {Function} params.askQuestion
 * @param {string} params.hook
 * @param {string} params.command
 * @param {string} params.remainingContent
 * @returns {Promise<'prepend'|'manual'>}
 */
async function askFingerprintedHookInstallation({
  askQuestion,
  hook,
  command,
  remainingContent,
}) {
  const { needs, insure } = getFingerprintedHookNeedText(hook);

  console.log(`\n${needs}`);
  console.log(`\nThe current ${hook} hook contains:`);
  console.log(`\n  ${remainingContent}`);
  console.log('\nWe need to prepend the command:');
  console.log(`\n  ${command}`);
  console.log('\nChoose:');
  console.log('  1. Prepend the command');
  console.log("  2. I'll do it myself");

  const answer = await askQuestion('Choose an option [1]: ');
  const normalized = (answer || '').trim();

  if (normalized === '' || normalized === '1') {
    return 'prepend';
  }

  console.log('No problem!');
  console.log(insure({ command }));
  return 'manual';
}


/**
 * Asks the user whether to continue after a Last of Readme operation failed
 * during an interactive session (e.g. npm version run in a terminal).
 *
 * @param {object} params
 * @param {Function} params.askQuestion
 * @param {string} params.operationName
 * @param {Error} params.error
 * @returns {Promise<string>} The user's answer.
 */
async function askWhetherToContinueAfterFailure({
  askQuestion,
  operationName,
  error,
}) {
  console.log(`
⚠️  Last of Readme failed to ${operationName}.`);
  console.log(`   ${error.message}`);
  console.log('Last of Readme may not work correctly if you continue.');
  return askQuestion('Continue anyway? [no]: ');
}

/**
 * Displays a warning when a Last of Readme operation failed in a
 * non-interactive session and the failure policy is not abort.
 *
 * @param {object} params
 * @param {string} params.operationName
 * @param {string} params.policy
 */
function displayNonInteractiveFailureWarning({ operationName, policy }) {
  console.warn(`⚠️  Last of Readme failed to ${operationName} (policy: ${policy}). Continuing.`);
}

module.exports = {
  askRemoteChoice,
  askRepositoryApiUrl,
  askRepositoryBrowserUrl,
  askPackageFilePath,
  askRepositoryUrlPath,
  askRemovePreviousPackageFile,
  printMissingPackageFileInformation,
  askCreateMinimalPackageFile,
  askInstallationPreconditions,
  askFingerprintedHookInstallation,
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
  printConvenienceHookReminder,
  askWhetherToContinueAfterFailure,
  displayNonInteractiveFailureWarning,
};
