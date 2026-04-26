#!/usr/bin/env node

const readline = require('readline');
const {
  normalizeOptionalText,
  normalizePackageFilePath,
} = require('./utils.cjs');
const {
  getCurrentInstalledPackageFilePath,
  getCurrentRepositoryUrlPath,
  getCurrentFilesField,
  gitRemoteNames,
  gitRemoteUrl,
} = require('../adapters/local-workspace-adapter.cjs');
const {
  askRemoteChoice,
  askPackageFilePath,
  askRepositoryUrlPath,
  askRemovePreviousPackageFile,
  printMissingPackageFileInformation,
  askCreateMinimalPackageFile,
} = require('./prompt-user-input.cjs');

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

// Only used to present choices in collectRemoteInput.
function getRemotesFromGit() {
  return gitRemoteNames().map((name) => ({
    name,
    url: gitRemoteUrl(name),
  }));
}

function chooseDefaultRemoteName(remotes) {
  if (remotes.length === 1) {
    return remotes[0].name;
  }

  return '';
}

function formatRemoteChoices(remotes) {
  if (remotes.length === 0) {
    return '  (no Git remotes found)';
  }

  return remotes
    .map(({ name, url }, index) => `  ${index + 1}. ${name} (${url})`)
    .join('\n');
}

function resolveSelectedRemote(answer, remotes, defaultRemoteName) {
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

    if (index >= 0 && index < remotes.length) {
      return remotes[index];
    }

    throw new Error('Please choose a listed remote by number or by name');
  }

  const byName = remotes.find(({ name }) => name === value);

  if (byName) {
    return byName;
  }

  throw new Error('Please choose a listed remote by number or by name');
}

async function collectRemoteInput(config = {}) {
  const remotes = getRemotesFromGit();
  const defaultRemoteName = chooseDefaultRemoteName(remotes);
  const rl = createInterface();

  try {
    const remoteAnswer = await askRemoteChoice({
      askQuestion: (question) => ask(rl, question),
      remotesDisplay: formatRemoteChoices(remotes),
      defaultRemoteName,
    });

    const selectedRemote = resolveSelectedRemote(
      remoteAnswer,
      remotes,
      defaultRemoteName
    );

    return {
      ...config,
      remote: {
        ...(config.remote || {}),
        localName: selectedRemote ? selectedRemote.name : null,
      },
    };
  } finally {
    rl.close();
  }
}

function prepareRemoteInput(config = {}) {
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

function shouldShowRepositoryUrlPathInformation(repositoryUrlPath) {
  return !repositoryUrlPath;
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
    const packageFilePathAnswer = await askPackageFilePath({
      askQuestion: (question) => ask(rl, question),
      defaultPackageFilePath,
    });

    const repositoryUrlPathAnswer = await askRepositoryUrlPath({
      askQuestion: (question) => ask(rl, question),
      defaultRepositoryUrlPath,
      shouldShowRepositoryUrlPathInformationForAnswer: (answer) =>
        shouldShowRepositoryUrlPathInformation(
          resolveCollectedRepositoryUrlPathAnswer(answer)
        ),
    });

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
      const removePreviousFileAnswer = await askRemovePreviousPackageFile({
        askQuestion: (question) => ask(rl, question),
        previousPackageFilePath,
      });

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

function preparePackageFilePathInput(config = {}) {
  const input = config.docLink || {};
  const resolvedPackageFilePath = resolveCollectedPackageFilePathAnswer(
    input.packageFilePathAnswer
  );

  return {
    ...config,
    docLink: {
      ...input,
      packageFilePath: normalizePackageFilePath(resolvedPackageFilePath),
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
    printMissingPackageFileInformation(packageFilePath);

    const createMinimalFileAnswer = await askCreateMinimalPackageFile({
      askQuestion: (question) => ask(rl, question),
    });
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

function prepareDocLinkPlaceholderInput(config = {}) {
  return config;
}

module.exports = {
  collectRemoteInput,
  prepareRemoteInput,
  collectPackageFilePathInput,
  preparePackageFilePathInput,
  collectDocLinkPlaceholderInput,
  prepareDocLinkPlaceholderInput,
};
