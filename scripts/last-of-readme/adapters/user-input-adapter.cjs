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
  askInstallationPreconditions,
  askFingerprintedHookInstallation,
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
  printConvenienceHookReminder,
  askWhetherToContinueAfterFailure,
  displayNonInteractiveFailureWarning,
} = require('./prompt-user-input.cjs');

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
  const control = pipelineState.control || {};
  const previousPackageFilePath = control.previousPackageFilePath;
  const currentFiles = control.currentFiles;
  const defaultPackageFilePath = control.defaultPackageFilePath || 'README.md';
  const defaultRepositoryUrlPath = control.defaultRepositoryUrlPath || '';

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
          resolveCollectedRepositoryUrlPathAnswer(
            answer,
            defaultRepositoryUrlPath
          )
        ),
    });

    let removePreviousPackageFileFromFiles = false;
    const effectivePackageFilePath = resolveCollectedPackageFilePathAnswer(
      packageFilePathAnswer,
      defaultPackageFilePath
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
        ...control,
        packageFilePathAnswer,
        repositoryUrlPathAnswer,
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
      remotes,
      defaultRemoteName,
    });

    return {
      ...pipelineState,
      control: {
        ...control,
        defaultRemoteName,
        remoteAnswer,
      },
    };
  } finally {
    rl.close();
  }
}

async function collectRemoteUrlsInput(pipelineState = {}) {
  const control = pipelineState.control || {};
  const defaultRepositoryApiUrl = control.defaultRepositoryApiUrl || '';
  const defaultRepositoryBrowserUrl = control.defaultRepositoryBrowserUrl || '';
  const rl = createInterface();

  try {
    const repositoryApiUrlAnswer = await askRepositoryApiUrl({
      askQuestion: (question) => ask(rl, question),
      defaultRepositoryApiUrl,
    });
    const repositoryBrowserUrlAnswer = await askRepositoryBrowserUrl({
      askQuestion: (question) => ask(rl, question),
      defaultRepositoryBrowserUrl,
    });

    return {
      ...pipelineState,
      control: {
        ...control,
        repositoryApiUrlAnswer,
        repositoryBrowserUrlAnswer,
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

function resolveCollectedPackageFilePathAnswer(
  packageFilePathAnswer,
  defaultPackageFilePath
) {
  return normalizeOptionalText(packageFilePathAnswer) || defaultPackageFilePath;
}

function resolveCollectedRepositoryUrlPathAnswer(
  repositoryUrlPathAnswer,
  defaultRepositoryUrlPath
) {
  if (repositoryUrlPathAnswer === '') {
    return defaultRepositoryUrlPath;
  }

  return normalizeOptionalText(repositoryUrlPathAnswer);
}


function tryDeriveGitHubUrlsFromRemoteUrl(remoteUrl) {
  try {
    return deriveGitHubUrlsFromRemoteUrl(remoteUrl);
  } catch {
    return null;
  }
}

function githubRemoteUrlsFromHostRepository(host, repository) {
  const normalizedHost = String(host).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const normalizedRepository = String(repository).replace(/^\/+/, '').replace(/\/+$/, '');
  const apiBase =
    normalizedHost === 'github.com'
      ? 'https://api.github.com'
      : `https://${normalizedHost}/api/v3`;

  return {
    kind: 'github',
    repositoryApiUrl: `${apiBase}/repos/${normalizedRepository}`,
    repositoryBrowserUrl: `https://${normalizedHost}/${normalizedRepository}`,
  };
}

function deriveGitHubUrlsFromRemoteUrl(remoteUrl) {
  if (typeof remoteUrl !== 'string' || !remoteUrl.trim()) {
    throw new Error('Git remote URL is empty');
  }

  let url = remoteUrl.trim();

  if (url.startsWith('git+')) {
    url = url.slice(4);
  }

  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  let match = url.match(/^https:\/\/([^/]+)\/([^/]+\/[^/]+)\/?$/);
  if (match) {
    return githubRemoteUrlsFromHostRepository(match[1], match[2]);
  }

  match = url.match(/^git@([^:]+):([^/]+\/[^/]+)$/);
  if (match) {
    return githubRemoteUrlsFromHostRepository(match[1], match[2]);
  }

  match = url.match(/^ssh:\/\/git@([^/]+)\/([^/]+\/[^/]+)$/);
  if (match) {
    return githubRemoteUrlsFromHostRepository(match[1], match[2]);
  }

  throw new Error('Git remote URL must point to a GitHub repository');
}


async function checkInstallationPreconditionsConsentInput({
  existingInstallation,
  convenienceNeeds,
}) {
  const rl = createInterface();
  try {
    return await askInstallationPreconditions({
      askQuestion: (question) => ask(rl, question),
      existingInstallation,
      convenienceNeeds,
    });
  } finally {
    rl.close();
  }
}


async function interactivelyInstallFingerprintedHook({
  hook,
  command,
  remainingContent,
}) {
  const rl = createInterface();
  try {
    return await askFingerprintedHookInstallation({
      askQuestion: (question) => ask(rl, question),
      hook,
      command,
      remainingContent,
    });
  } finally {
    rl.close();
  }
}


function isInteractiveSession() {
  return Boolean(
    process.stdin.isTTY &&
    process.stdout.isTTY &&
    !process.env.CI
  );
}

async function askWhetherToContinueAfterFailureInput({ operationName, error }) {
  const rl = createInterface();
  try {
    const answer = await askWhetherToContinueAfterFailure({
      askQuestion: (question) => ask(rl, question),
      operationName,
      error,
    });
    const normalized = (answer || '').trim().toLowerCase();
    return ['y', 'yes'].includes(normalized);
  } finally {
    rl.close();
  }
}

module.exports = {
  collectDocLinkPlaceholderInput,
  collectPackageFilePathInput,
  collectRemoteInput,
  collectRemoteUrlsInput,
  tryDeriveGitHubUrlsFromRemoteUrl,
  checkInstallationPreconditionsConsentInput,
  interactivelyInstallFingerprintedHook,
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
  printConvenienceHookReminder,
  isInteractiveSession,
  askWhetherToContinueAfterFailure: askWhetherToContinueAfterFailureInput,
  displayNonInteractiveFailureWarning,
};
