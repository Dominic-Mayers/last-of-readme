#!/usr/bin/env node

const {
  normalizeOptionalText,
} = require('../install/utils.cjs');
const {
  createInterface,
  ask,
} = require('./user-input-utils.cjs');
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

/**
 * Collects user consent for minimal package-file creation when the selected
 * package file does not yet exist.
 *
 * The collected input is used by checkLinkPlaceholderRequirements() in the
 * checkLinkPlaceholder phase.
 */
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

/**
 * Collects the packageFilePath value that selects the package documentation
 * file and the repositoryUrlPath value embedded in resolver links, which become the
 * `packageFilePath` and `repositoryUrlPath` configuration values.
 *
 * This also collects the optional decision used later by
 * installDocLinkConfigFields() to determine whether a previous package file
 * should be removed from the npm files field.
 */
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

/**
 * Collects the Git remote selection. The selected remote name becomes the Last
 * of Readme remoteName value used at runtime to publish tags, and its URL is
 * used to derive default repositoryApiUrl and repositoryBrowserUrl values.
 *
 * This step depends on the remotes collected earlier by
 * collectGitRemotesEnvironmentInput(). The selected remote is later validated
 * for publication capability by a dry-run in checkGitRemoteRequirements().
 */
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

/**
 * Collects the repositoryApiUrl and repositoryBrowserUrl values that the
 * resolver uses to query tags and build documentation links.
 *
 * The defaults shown to the user are derived earlier by
 * prepareRemoteDefaultsInput() from the selected remote URL. The finalized
 * URLs are later validated by checkGitRemoteRequirements().
 */
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


/**
 * Attempts to derive GitHub repository API/browser URLs from the selected Git
 * remote URL.
 *
 * This helper supports prepareRemoteDefaultsInput(), which uses the derived
 * values as defaults for collectRemoteUrlsInput().
 */
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


/**
 * Prompts the user for consent as part of
 * checkInstallationPreconditionsRequirements(), presenting existing-installation
 * detection results and convenience workflow requirements before the installer
 * proceeds.
 *
 * Throws when the user does not consent.
 */
async function assertInstallationPreconditionsConsent({
  existingInstallation,
  convenienceNeeds,
}) {
  const rl = createInterface();
  try {
    const answer = await askInstallationPreconditions({
      askQuestion: (question) => ask(rl, question),
      existingInstallation,
      convenienceNeeds,
    });

    const normalized = (answer || '').trim().toLowerCase();
    const consented = ['y', 'yes'].includes(normalized);

    if (!consented) {
      throw new Error('Installation aborted. You can run the installer again when you are ready.');
    }
  } finally {
    rl.close();
  }
}


/**
 * Prompts the user to decide how a Last of Readme-owned npm hook command
 * should be installed when the target hook already has content.
 *
 * Called from collectLastOfReadmeOwnedHookInstallationInput() in the
 * installation-per-se phase install-owned-version-hooks.cjs, whose result is
 * consumed by installLastOfReadmeOwnedVersionHookCommands() to update
 * package.json.
 *
 * @param {object} params
 * @param {string} params.hook - npm lifecycle hook that needs a Last of
 * Readme-owned command.
 * @param {string} params.command - Last of Readme-owned command to install.
 * @param {string} params.remainingContent - Existing user-owned hook content
 * that the installer may preserve after the Last of Readme command.
 * @returns {Promise<'prepend'|'manual'>} User-selected hook installation action.
 */
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

/**
 * Asks whether an interactive runtime-management wrapper should continue after
 * a Last of Readme operation failed.
 *
 * @param {object} params
 * @param {string} params.operationName - Last of Readme operation that failed.
 * @param {Error} params.error - Failure reported by the attempted operation.
 * @returns {Promise<boolean>} True when the user explicitly chooses to continue.
 */
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
  assertInstallationPreconditionsConsent,
  interactivelyInstallFingerprintedHook,
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
  printConvenienceHookReminder,
  isInteractiveSession,
  askWhetherToContinueAfterFailure: askWhetherToContinueAfterFailureInput,
  displayNonInteractiveFailureWarning,
};
