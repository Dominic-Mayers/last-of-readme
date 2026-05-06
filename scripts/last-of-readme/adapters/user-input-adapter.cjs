#!/usr/bin/env node

const readline = require('readline');
const {
  normalizeOptionalText,
} = require('../install/utils.cjs');
const {
  askRemoteChoice,
  askRepositoryApiUrl,
  askRepositoryBrowserUrl,
  askPackageFilePath,
  askRepositoryUrlPath,
  askRemovePreviousPackageFile,
  printMissingPackageFileInformation,
  askCreateMinimalPackageFile,
} = require('./prompt-user-input.cjs');
const {
  getCurrentFilesField,
  getCurrentInstalledPackageFilePath,
  getCurrentRemoteConfiguration,
  getCurrentRepositoryUrlPath,
  tryDeriveGitHubUrlsFromRemoteUrl,
} = require('./npm-adapter.cjs');

// TODO architecture:
// These collection adapters still obtain some defaults from npm in order to
// preserve current behavior. Later, phases should collect those inputs from
// npm step logic and pass them into user-input step logic before these
// prompt-only adapters are called.

async function collectDocLinkPlaceholderInput(pipelineState = {}) {
  const control = pipelineState.control || {};

  if (control.packageFileExists) {
    return pipelineState;
  }

  const packageFilePath = pipelineState.config?.packageFilePath;
  const rl = createInterface();

  try {
    printMissingPackageFileInformation(packageFilePath);

    const createMinimalFileAnswer = await askCreateMinimalPackageFile({
      askQuestion: (question) => ask(rl, question),
    });
    const shouldCreateMinimalFile =
      parseBooleanAnswer(createMinimalFileAnswer, false);

    return {
      ...pipelineState,
      control: {
        ...control,
        shouldCreateMinimalFile,
      },
    };
  } finally {
    rl.close();
  }
}

async function collectPackageFilePathInput(pipelineState = {}) {
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
      ...pipelineState,
      control: {
        ...(pipelineState.control || {}),
        packageFilePathAnswer,
        repositoryUrlPathAnswer,
        previousPackageFilePath,
        defaultPackageFilePath,
        defaultRepositoryUrlPath,
        removePreviousPackageFileFromFiles,
      },
    };
  } finally {
    rl.close();
  }
}

async function collectRemoteInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const remotes = Array.isArray(control.availableRemotes)
    ? control.availableRemotes
    : [];
  const configuredRemoteName = control.configuredRemoteNameAnswer;
  const defaultRemoteName = chooseDefaultRemoteName(
    remotes,
    configuredRemoteName
  );
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

    const derivedRemote = selectedRemote
      ? tryDeriveGitHubUrlsFromRemoteUrl(selectedRemote.url)
      : null;

    const currentRemoteConfiguration = getCurrentRemoteConfiguration();
    const defaultRepositoryApiUrl =
      (currentRemoteConfiguration
        ? currentRemoteConfiguration.repositoryApiUrl
        : '') || (derivedRemote ? derivedRemote.repositoryApiUrl : '');
    const defaultRepositoryBrowserUrl =
      (currentRemoteConfiguration
        ? currentRemoteConfiguration.repositoryBrowserUrl
        : '') || (derivedRemote ? derivedRemote.repositoryBrowserUrl : '');

    const repositoryApiUrlAnswer = await askRepositoryApiUrl({
      askQuestion: (question) => ask(rl, question),
      defaultRepositoryApiUrl,
    });
    const repositoryBrowserUrlAnswer = await askRepositoryBrowserUrl({
      askQuestion: (question) => ask(rl, question),
      defaultRepositoryBrowserUrl,
    });

    const repositoryApiUrl = resolveCollectedUrlAnswer(
      repositoryApiUrlAnswer,
      defaultRepositoryApiUrl
    );
    const repositoryBrowserUrl = resolveCollectedUrlAnswer(
      repositoryBrowserUrlAnswer,
      defaultRepositoryBrowserUrl
    );

    return {
      ...pipelineState,
      control: {
        ...control,
        localName: selectedRemote ? selectedRemote.name : null,
        repositoryUrl: selectedRemote ? selectedRemote.url : null,
        repositoryApiUrl,
        repositoryBrowserUrl,
      },
    };
  } finally {
    rl.close();
  }
}

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

function chooseDefaultRemoteName(remotes, configuredRemoteName = '') {
  if (
    typeof configuredRemoteName === 'string' &&
    remotes.some(({ name }) => name === configuredRemoteName)
  ) {
    return configuredRemoteName;
  }

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

function resolveCollectedUrlAnswer(answer, defaultValue) {
  return normalizeOptionalText(answer) || defaultValue || '';
}

module.exports = {
  collectDocLinkPlaceholderInput,
  collectPackageFilePathInput,
  collectRemoteInput,
};
