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

module.exports = {
  askRemoteChoice,
  askPackageFilePath,
  askRepositoryUrlPath,
  askRemovePreviousPackageFile,
  printMissingPackageFileInformation,
  askCreateMinimalPackageFile,
};
