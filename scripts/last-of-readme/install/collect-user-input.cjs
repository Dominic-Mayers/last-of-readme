#!/usr/bin/env node

const readline = require('readline');
const {
  getCurrentInstalledPackageFilePath,
  getCurrentRepositoryUrlPath,
  getCurrentFilesField,
  normalizeOptionalText,
} = require('./utils.cjs');
const { askRemoteChoice } = require('./prompt-user-input.cjs');

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function parseBooleanAnswer(value, defaultValue) {
  const normalized = normalizeOptionalText(value).toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (['y', 'yes', 'true'].includes(normalized)) {
    return true;
  }

  if (['n', 'no', 'false'].includes(normalized)) {
    return false;
  }

  throw new Error('Please answer yes or no');
}

async function collectRemoteInput(config = {}) {
  const selectedRemote = await askRemoteChoice();

  return {
    ...config,
    remote: {
      ...(config.remote || {}),
      localName: selectedRemote ? selectedRemote.name : null,
    },
  };
}

function cleanRemoteInput(config = {}) {
  return config;
}

function getDefaultPackageFilePath() {
  return getCurrentInstalledPackageFilePath() || 'README.md';
}

function getDefaultRepositoryUrlPath() {
  return getCurrentRepositoryUrlPath() || '';
}

function shouldAskToRemovePreviousPackageFile({
  previousPackageFilePath,
  nextPackageFilePath,
  currentFiles,
}) {
  return (
    Array.isArray(currentFiles) &&
    typeof previousPackageFilePath === 'string' &&
    previousPackageFilePath.length > 0 &&
    previousPackageFilePath !== nextPackageFilePath &&
    currentFiles.includes(previousPackageFilePath)
  );
}

function buildPackageFilePathPrompt(defaultPackageFilePath) {
  return `Package file to update [${defaultPackageFilePath}]: `;
}

function buildRepositoryUrlPathPrompt(defaultRepositoryUrlPath) {
  if (defaultRepositoryUrlPath) {
    return `Repository URL path to open after resolution [${defaultRepositoryUrlPath}]: `;
  }

  return 'Repository URL path to open after resolution (empty for the repository URL without a path): ';
}

function printRepositoryUrlPathInformation(repositoryUrlPath) {
  if (repositoryUrlPath) {
    return;
  }

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

function resolveCollectedPackageFilePathAnswer(packageFilePathAnswer) {
  const defaultPackageFilePath = getDefaultPackageFilePath();
  return normalizeOptionalText(packageFilePathAnswer) || defaultPackageFilePath;
}

function resolveCollectedRepositoryUrlPathAnswer(repositoryUrlPathAnswer) {
  const defaultRepositoryUrlPath = getDefaultRepositoryUrlPath();

  if (repositoryUrlPathAnswer === '') {
    return defaultRepositoryUrlPath;
  }

  return normalizeOptionalText(repositoryUrlPathAnswer);
}

async function collectPackageFilePathInput(config = {}) {
  const previousPackageFilePath = getCurrentInstalledPackageFilePath();
  const currentFiles = getCurrentFilesField();
  const defaultPackageFilePath = getDefaultPackageFilePath();
  const defaultRepositoryUrlPath = getDefaultRepositoryUrlPath();

  const rl = createInterface();

  try {
    const packageFilePathAnswer = await ask(
      rl,
      buildPackageFilePathPrompt(defaultPackageFilePath)
    );

    const repositoryUrlPathAnswer = await ask(
      rl,
      buildRepositoryUrlPathPrompt(defaultRepositoryUrlPath)
    );

    const effectiveRepositoryUrlPath = resolveCollectedRepositoryUrlPathAnswer(
      repositoryUrlPathAnswer
    );
    printRepositoryUrlPathInformation(effectiveRepositoryUrlPath);

    let removePreviousPackageFileFromFiles = false;
    const effectivePackageFilePath = resolveCollectedPackageFilePathAnswer(
      packageFilePathAnswer
    );

    if (
      shouldAskToRemovePreviousPackageFile({
        previousPackageFilePath,
        nextPackageFilePath: effectivePackageFilePath,
        currentFiles,
      })
    ) {
      const removePreviousFileAnswer = await ask(
        rl,
        `Remove previous package file ${previousPackageFilePath} from package.json.files? [no]: `
      );

      removePreviousPackageFileFromFiles =
        parseBooleanAnswer(removePreviousFileAnswer, false);
    }

    return {
      ...config,
      docLink: {
        ...(config.docLink || {}),
        packageFilePathAnswer,
        repositoryUrlPathAnswer,
        previousPackageFilePath,
        removePreviousPackageFileFromFiles,
      },
    };
  } finally {
    rl.close();
  }
}

function cleanPackageFilePathInput(config = {}) {
  const input = config.docLink || {};

  return {
    ...config,
    docLink: {
      ...input,
      packageFilePath: resolveCollectedPackageFilePathAnswer(
        input.packageFilePathAnswer
      ),
      repositoryUrlPath: resolveCollectedRepositoryUrlPathAnswer(
        input.repositoryUrlPathAnswer
      ),
    },
  };
}

async function collectDocLinkPlaceholderInput(config = {}) {
  const docLink = config.docLink || {};

  if (docLink.packageFileExists) {
    return config;
  }

  const packageFilePath = docLink.packageFilePath;
  const rl = createInterface();

  try {
    console.log(`
ℹ️ ${packageFilePath} does not exist.`);

    const createMinimalFileAnswer = await ask(
      rl,
      'Create a minimal package file? [no]: '
    );
    const shouldCreateMinimalFile =
      parseBooleanAnswer(createMinimalFileAnswer, false);

    return {
      ...config,
      docLink: {
        ...(config.docLink || {}),
        shouldCreateMinimalFile,
      },
    };
  } finally {
    rl.close();
  }
}

function cleanDocLinkPlaceholderInput(config = {}) {
  return config;
}

module.exports = {
  collectRemoteInput,
  cleanRemoteInput,
  collectPackageFilePathInput,
  cleanPackageFilePathInput,
  collectDocLinkPlaceholderInput,
  cleanDocLinkPlaceholderInput,
};
