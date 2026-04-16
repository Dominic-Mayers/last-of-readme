#!/usr/bin/env node

const readline = require('readline');
const path = require('path');
const {
  gitRemoteNames,
  gitRemoteUrl,
  getCurrentInstalledPackageFilePath,
  getCurrentRepositoryUrlPath,
  getCurrentFilesField,
  normalizeOptionalText,
} = require('./utils.cjs');

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

function listRemoteChoices() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}

function chooseDefaultRemoteName(remoteChoices) {
  if (remoteChoices.length === 1) {
    return remoteChoices[0].name;
  }

  return '';
}

function formatRemoteChoices(remoteChoices) {
  if (remoteChoices.length === 0) {
    return '  (no Git remotes found)';
  }

  return remoteChoices
    .map(({ name, url }, index) => `  ${index + 1}. ${name} (${url})`)
    .join('\n');
}

function resolveRemoteSelection(answer, remoteChoices, defaultRemoteName) {
  const trimmed = normalizeOptionalText(answer);
  const value = trimmed || defaultRemoteName;

  if (!value) {
    return null;
  }

  if (['none', 'no', 'skip'].includes(value.toLowerCase())) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    const index = Number(value) - 1;

    if (index >= 0 && index < remoteChoices.length) {
      return remoteChoices[index].name;
    }

    throw new Error('Please choose a listed remote by number or by name');
  }

  const byName = remoteChoices.find(({ name }) => name === value);

  if (byName) {
    return byName.name;
  }

  throw new Error('Please choose a listed remote by number or by name');
}

async function collectRemoteInput(config = {}) {
  const remoteChoices = listRemoteChoices();
  const defaultRemoteName = chooseDefaultRemoteName(remoteChoices);
  const rl = createInterface();

  try {
    console.log('Git remotes:');
    console.log(formatRemoteChoices(remoteChoices));
    console.log('Select a remote by number or by name. Enter none to stop.');

    const remoteAnswer = await ask(
      rl,
      defaultRemoteName
        ? `Remote to use for Last of Readme [${defaultRemoteName}]: `
        : 'Remote to use for Last of Readme: '
    );

    const localName = resolveRemoteSelection(
      remoteAnswer,
      remoteChoices,
      defaultRemoteName
    );

    return {
      ...config,
      remote: {
        ...(config.remote || {}),
        localName,
      },
    };
  } finally {
    rl.close();
  }
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
    const packageFilePath =
      normalizeOptionalText(packageFilePathAnswer) || defaultPackageFilePath;

    const repositoryUrlPathAnswer = await ask(
      rl,
      buildRepositoryUrlPathPrompt(defaultRepositoryUrlPath)
    );
    const repositoryUrlPath =
      repositoryUrlPathAnswer === ''
        ? defaultRepositoryUrlPath
        : normalizeOptionalText(repositoryUrlPathAnswer);

    printRepositoryUrlPathInformation(repositoryUrlPath);

    let removePreviousPackageFileFromFiles = false;

    if (
      shouldAskToRemovePreviousPackageFile({
        previousPackageFilePath,
        nextPackageFilePath: packageFilePath,
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
        packageFilePath,
        repositoryUrlPath,
        previousPackageFilePath,
        removePreviousPackageFileFromFiles,
      },
    };
  } finally {
    rl.close();
  }
}

async function collectDocLinkPlaceholderInput(config = {}) {
  const docLink = config.docLink || {};

  if (docLink.packageFileExists) {
    return config;
  }

  const packageFilePath = docLink.packageFilePath;
  const rl = createInterface();

  try {
    console.log(`\nℹ️ ${packageFilePath} does not exist.`);

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

module.exports = {
  collectRemoteInput,
  collectPackageFilePathInput,
  collectDocLinkPlaceholderInput,
};
