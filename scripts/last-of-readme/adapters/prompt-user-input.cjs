#!/usr/bin/env node

async function askRemoteChoice({
  askQuestion,
  remotesDisplay,
  defaultRemoteName,
}) {
  console.log('Git remotes:');
  console.log(remotesDisplay);
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
    for (const { hook, command, needs } of convenienceNeeds) {
      console.log(`\n  ${hook}:`);
      console.log(`    ${needs}`);
      console.log(`    Command: ${command}`);
    }
    console.log('\nIf you proceed, Last of Readme will remind you to ensure these');
    console.log('commands are executed, either automatically or manually.');
    console.log('');
  }

  return askQuestion('Proceed with installation? [no]: ');
}


/**
 * Generic scripts hook interaction.
 *
 * Always prints `needs` to describe the situation.
 * When `options` are provided, presents them with "I'll do it myself" appended
 * automatically. On "I'll do it myself", prints "No problem!" then `insure`.
 * When no `options`, prints `insure` directly.
 *
 * @param {object} params
 * @param {Function} params.askQuestion
 * @param {string} params.needs - situation description
 * @param {string} params.insure - concrete action the user can take
 * @param {Array<{label: string, value: string}>} [params.options]
 * @returns {Promise<string|null>} chosen option value, or null when no options
 */
async function askScriptsHookSituation({ askQuestion, needs, insure, options }) {
  console.log(`\n${needs}`);

  if (!options || options.length === 0) {
    console.log(insure);
    return null;
  }

  const allOptions = [...options, { label: "I'll do it myself", value: 'manual' }];
  allOptions.forEach((opt, index) => {
    console.log(`  ${index + 1}. ${opt.label}`);
  });

  const answer = await askQuestion('Choose an option [1]: ');
  const normalized = (answer || '').trim();
  const index = normalized === '' ? 0 : parseInt(normalized, 10) - 1;

  const chosen =
    index >= 0 && index < allOptions.length
      ? allOptions[index]
      : allOptions[allOptions.length - 1];

  if (chosen.value === 'manual') {
    console.log("No problem!");
    console.log(insure);
  }

  return chosen.value;
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
  askScriptsHookSituation,
};
