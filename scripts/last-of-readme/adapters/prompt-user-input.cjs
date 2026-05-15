#!/usr/bin/env node

const {
  createInterface,
  ask,
} = require('./user-input-utils.cjs');

/**
 * Prompts for the remoteName value used by collectRemoteInput().
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @param {{ name: string, url: string }[]} params.remotes - Local Git remotes
 * available for Last of Readme tag publication.
 * @param {string} params.defaultRemoteName - Default remoteName value shown
 * when one can be inferred from existing configuration or the local Git state.
 * @returns {Promise<string>} User-entered remote selection.
 */
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


/**
 * Prompts for the repositoryApiUrl value used by collectRemoteUrlsInput().
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @param {string} params.defaultRepositoryApiUrl - Default GitHub API endpoint
 * derived from the selected remote or read from the installed repositoryApiUrl.
 * @returns {Promise<string>} User-entered repositoryApiUrl answer.
 */
async function askRepositoryApiUrl({
  askQuestion,
  defaultRepositoryApiUrl,
}) {
  const question = defaultRepositoryApiUrl
    ? `Repository API URL [${defaultRepositoryApiUrl}] (press Enter to accept): `
    : 'Repository API URL: ';

  return askQuestion(question);
}

/**
 * Prompts for the repositoryBrowserUrl value used by collectRemoteUrlsInput().
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @param {string} params.defaultRepositoryBrowserUrl - Default repository
 * browser URL derived from the selected remote or read from the installed value.
 * @returns {Promise<string>} User-entered repositoryBrowserUrl answer.
 */
async function askRepositoryBrowserUrl({
  askQuestion,
  defaultRepositoryBrowserUrl,
}) {
  const question = defaultRepositoryBrowserUrl
    ? `Repository browser URL [${defaultRepositoryBrowserUrl}] (press Enter to accept): `
    : 'Repository browser URL: ';

  return askQuestion(question);
}

/**
 * Prompts for the packageFilePath value used by collectPackageFilePathInput().
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @param {string} params.defaultPackageFilePath - Default package documentation
 * file path shown when the user presses Enter.
 * @returns {Promise<string>} User-entered packageFilePath answer.
 */
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

/**
 * Prompts for the repositoryUrlPath value used by collectPackageFilePathInput().
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @param {string} params.defaultRepositoryUrlPath - Default repository-relative
 * documentation path embedded in generated resolver links.
 * @param {Function} params.shouldShowRepositoryUrlPathInformationForAnswer -
 * Predicate used to decide whether to explain the empty repositoryUrlPath case.
 * @returns {Promise<string>} User-entered repositoryUrlPath answer.
 */
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

/**
 * Prompts for whether the previous package documentation file should be removed
 * from package.json.files after packageFilePath changes.
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @param {string} params.previousPackageFilePath - Previously installed package
 * documentation file path that may be removed from package.json.files.
 * @returns {Promise<string>} User-entered yes/no answer.
 */
async function askRemovePreviousPackageFile({
  askQuestion,
  previousPackageFilePath,
}) {
  return askQuestion(
    `Remove previous package file ${previousPackageFilePath} from package.json.files? [no]: `
  );
}

/**
 * Prints the explanation shown before collectDocLinkPlaceholderInput() asks
 * whether to create a missing package documentation file.
 *
 * @param {string} packageFilePath - Missing package documentation file path.
 */
function printMissingPackageFileInformation(packageFilePath) {
  console.log(`
ℹ️ ${packageFilePath} does not exist.`);
}

/**
 * Prompts for whether createDocLinkFileIfNeeded() should create a minimal
 * package documentation file.
 *
 * @param {object} params
 * @param {Function} params.askQuestion - Function that displays the question
 * and resolves with the user's answer.
 * @returns {Promise<string>} User-entered yes/no answer.
 */
async function askCreateMinimalPackageFile({ askQuestion }) {
  return askQuestion('Create a minimal package file? [no]: ');
}


function formatExistingInstallationDetails(details) {
  const lines = [];
  if (details.hasLastOfReadmeField) {
    lines.push('  - lastOfReadme field in package.json');
  }
  for (const hook of details.hooksWithInstallation) {
    lines.push(`  - ${hook} scripts hook references last-of-readme`);
  }
  return lines.join('\n');
}

/**
 * Presents a unified summary of installation preconditions and asks the user
 * to proceed or abort. Shows:
 * - Existing installation details (if any).
 * - Maintainer-owned workflow steps that Last of Readme depends on.
 * Then asks once whether to proceed.
 *
 * @param {object} params
 * @param {Function} params.askQuestion
 * @param {{ hasLastOfReadmeField: boolean, hooksWithInstallation: string[] } | null} params.existingInstallation -
 * Existing installed Last of Readme footprint detected from lastOfReadme and
 * npm lifecycle hook fields.
 * @param {{ kind: string, hook: string, exampleCommand: string }[]} params.convenienceNeeds -
 * Maintainer-owned workflow steps that Last of Readme needs maintainers to
 * implement, with example commands shown only as possible implementations.
 * @returns {Promise<string>} User-entered yes/no answer that
 * assertInstallationPreconditionsConsent() interprets as consent or abort.
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
    console.log('ℹ️  Last of Readme also depends on maintainer-owned workflow steps.');
    console.log('   These steps are not installed automatically because they belong to');
    console.log('   your package workflow. The examples below show one possible way to');
    console.log('   implement each workflow step.');
    for (const need of convenienceNeeds) {
      const { responsibility, example } = getConvenienceNeedText(need);
      console.log(`\n  ${need.hook}:`);
      console.log(`    Workflow step: ${responsibility}`);
      console.log(`    Example: ${example}`);
    }
    console.log('\n   You can use these examples or adapt them in a way that fits your workflow.');
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
    exampleIntro:
      'For example, a version hook could stage the package documentation file after Last of Readme updates it:',
    insure:
      'Last of Readme will not install this maintainer-owned step. Make sure your version workflow stages the updated package documentation file before the version commit is created.',
  },
  pushTagsAfterVersion: {
    needs:
      'Last of Readme tags are not pushed to the remote automatically. Without them, the Last of Readme resolver will not work.',
    exampleIntro:
      'For example, a postversion hook could push commits and tags after npm creates the version commit:',
    insure:
      'Last of Readme will not install this maintainer-owned step. Make sure your release workflow pushes the Last of Readme tags to the remote repository.',
  },
};

function getConvenienceNeedText(need) {
  const text = CONVENIENCE_NEED_TEXT[need.kind];

  if (!text) {
    throw new Error(`Unknown convenience need kind: ${need.kind}`);
  }

  const example = need.exampleCommand
    ? `${text.exampleIntro}\n     ${need.exampleCommand}`
    : text.exampleIntro;

  return {
    needs: text.needs,
    responsibility: text.needs,
    example,
    insure: text.insure,
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
  const { insure, example } = getConvenienceNeedText(need);
  console.log(`\nℹ️  ${need.hook}: ${insure}`);
  if (example) {
    console.log(`   Example: ${example}`);
  }
}

/**
 * Presents a fingerprinted hook installation decision.
 *
 * @param {object} params
 * @param {Function} params.askQuestion
 * @param {string} params.hook - npm lifecycle hook where the Last of
 * Readme-owned command is needed.
 * @param {string} params.command - Last of Readme-owned command that should run
 * in the hook.
 * @param {string} params.remainingContent - Existing user-owned hook content
 * that would remain after removing the owned command.
 * @returns {Promise<'prepend'|'manual'>} User-selected hook installation action.
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
  console.log('  1. Prepend the command automatically');
  console.log(`  2. I'll do it myself (edit package.json to ensure the command runs in the ${hook} hook)`);

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
 * @param {string} params.operationName - Last of Readme operation that failed.
 * @param {Error} params.error - Failure reported by the attempted operation.
 * @returns {Promise<string>} User-entered yes/no answer interpreted by
 * askWhetherToContinueAfterFailureInput().
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
 * @param {string} params.operationName - Last of Readme operation that failed.
 * @param {string} params.policy - nonInteractiveFailurePolicy value that allows
 * the runtime-management wrapper to continue after the failure.
 */
function displayNonInteractiveFailureWarning({ operationName, policy }) {
  console.warn(`⚠️  Last of Readme failed to ${operationName} (policy: ${policy}). Continuing.`);
}

const CONTRACT_DESCRIPTIONS = {
  'until-next': describeUntilNext,
  'until-next-warn': describeUntilNextWarn,
  'until-branch': describeUntilBranch,
  'until-branch-warn': describeUntilBranchWarn,
  'correction-of': describeCorrectionOf,
};

function describeUntilNext(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using this order:`,
    '',
    '1. vX.Y.Z-last-of',
    '2. vX.Y.Z-successor-of',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. A page listing multiple branches containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeUntilNextWarn(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using the same order as until-next, but with a warning when vX.Y.Z-last-of is absent.`,
    '',
    'Resolution order:',
    '',
    '1. vX.Y.Z-last-of',
    '2. vX.Y.Z-successor-of',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. A page listing multiple branches containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeUntilBranchWarn(documentationPath) {
  return [
    `The documentation link will redirect directly to ${documentationPath} only when vX.Y.Z-last-of exists.`,
    '',
    'If vX.Y.Z-last-of does not exist, the resolver will show an intermediary page saying that no authoritative documentation was found.',
    '',
    'The intermediary page will propose fallback documentation using this order:',
    '',
    '1. A page listing multiple branches containing vX.Y.Z',
    '2. vX.Y.Z-successor-of',
    '3. HEAD of a unique branch containing vX.Y.Z',
    '4. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeUntilBranch(documentationPath) {
  return [
    `The documentation link will resolve ${documentationPath} using the same order as until-branch-warn, but without warning when vX.Y.Z-last-of is absent.`,
    '',
    'Resolution order:',
    '',
    '1. vX.Y.Z-last-of',
    '2. A page listing multiple branches containing vX.Y.Z',
    '3. vX.Y.Z-successor-of',
    '4. HEAD of a unique branch containing vX.Y.Z',
    '5. vX.Y.Z itself',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

function describeCorrectionOf(documentationPath) {
  return [
    `The documentation link will redirect to ${documentationPath} at vX.Y.Z-correction-of when that tag exists.`,
    '',
    'If vX.Y.Z-correction-of does not exist, the resolver will redirect to vX.Y.Z.',
    '',
    'The correction-of tag is a movable documentation pointer. Running the tag script for correction-of again replaces the correction pointer for the current version.',
    '',
    'Use this behavior for future version bumps?',
  ].join('\n');
}

async function askDocumentationContractConfirmation({
  contract,
  documentationPath,
}) {
  const describe = CONTRACT_DESCRIPTIONS[contract];
  if (!describe) {
    throw new Error(`Unsupported Last of Readme contract: ${contract}`);
  }

  const rl = createInterface();
  try {
    const answer = await ask(rl, `${describe(documentationPath)} [y/N] `);
    return /^y(?:es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

function printNoChangesMade() {
  console.log('No changes made.');
}

function printNextContractSet(contract) {
  console.log(`✅ Last of Readme next contract set to ${contract}`);
}

function printTagCreated(tag) {
  console.log(`✅ Created tag ${tag}`);
}

function printMovableTagCreated(tag) {
  console.log(`✅ Created or replaced tag ${tag}`);
}

function printTagPushed(tag) {
  console.log(`✅ Pushed tag ${tag}`);
}

function printMovableTagPushed(tag) {
  console.log(`✅ Pushed or replaced tag ${tag}`);
}

function printTagNotPushed() {
  console.log('ℹ️ Tag not pushed');
}

function printPackageFileUpdatedForVersion(documentationPath, version) {
  console.log(`✅ ${documentationPath} updated for version ${version}`);
}

function printBasicRequirementsSatisfied() {
  console.log('✔ Basic requirements satisfied');
}

function formatContractUsage() {
  return [
    'Usage: last-of-readme contract <contract>',
    'Supported contracts: until-next, until-next-warn, until-branch, until-branch-warn, correction-of',
  ].join('\n');
}

function formatTagDocUsage() {
  return 'Usage: last-of-readme tag-doc <last-of|successor-of|correction-of> [--no-push]';
}

function formatUpdateReadmeLinkUsage() {
  return 'Usage: last-of-readme update-readme-link [documentation-path] [url-path]';
}

function formatUnsupportedContract(contract) {
  return `Unsupported Last of Readme contract: ${contract}`;
}

function formatUnknownDocTagKind(kind) {
  return `Unknown doc tag kind: ${kind}`;
}

function printAbortMessage(message) {
  console.error(`❌ ${message}`);
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
  askDocumentationContractConfirmation,
  printNoChangesMade,
  printNextContractSet,
  printTagCreated,
  printMovableTagCreated,
  printTagPushed,
  printMovableTagPushed,
  printTagNotPushed,
  printPackageFileUpdatedForVersion,
  printBasicRequirementsSatisfied,
  formatContractUsage,
  formatTagDocUsage,
  formatUpdateReadmeLinkUsage,
  formatUnsupportedContract,
  formatUnknownDocTagKind,
  printAbortMessage,
};
