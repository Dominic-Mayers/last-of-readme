#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { listRemoteChoices } = require('./install-remote.cjs');

function loadPackageJson() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Could not read package.json: ${error.message}`);
  }
}

function parsePackageFilePathFromVersionScript(versionScript) {
  if (typeof versionScript !== 'string') {
    return null;
  }

  const match = versionScript.match(
    /node\s+scripts\/update-readme-link\.cjs\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/
  );

  return match ? (match[1] || match[2] || match[3]) : null;
}

function parseRepositoryUrlPathFromVersionScript(versionScript) {
  if (typeof versionScript !== 'string') {
    return null;
  }

  const match = versionScript.match(
    /node\s+scripts\/update-readme-link\.cjs\s+(?:'[^']+'|"[^"]+"|[^\s]+)\s+(?:'([^']*)'|"([^"]*)"|([^\s]+))/
  );

  return match ? (match[1] || match[2] || match[3] || '') : null;
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
  const normalized = String(value || '').trim().toLowerCase();

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
  const trimmed = String(answer || '').trim();
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

async function collectDocLinkInput(config = {}) {
  const packageJson = loadPackageJson();
  const previousPackageFilePath =
    parsePackageFilePathFromVersionScript(packageJson?.scripts?.version) || null;
  const previousRepositoryUrlPath =
    parseRepositoryUrlPathFromVersionScript(packageJson?.scripts?.version);
  const defaultPackageFilePath = previousPackageFilePath || 'README.md';
  const defaultRepositoryUrlPath =
    previousRepositoryUrlPath === null ? '' : previousRepositoryUrlPath;

  const rl = createInterface();

  try {
    const filePathAnswer = await ask(
      rl,
      `Package file to update [${defaultPackageFilePath}]: `
    );
    const packageFilePath =
      String(filePathAnswer || '').trim() || defaultPackageFilePath;

    const urlPathQuestion = defaultRepositoryUrlPath
      ? `Repository URL path to open after resolution [${defaultRepositoryUrlPath}]: `
      : 'Repository URL path to open after resolution (empty for the repository URL without a path): ';
    const urlPathAnswer = await ask(rl, urlPathQuestion);
    const repositoryUrlPath =
      urlPathAnswer === '' ? defaultRepositoryUrlPath : String(urlPathAnswer).trim();

    if (!repositoryUrlPath) {
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

    const createMinimalAnswer = await ask(
      rl,
      'Create a minimal package file if it does not exist? [no]: '
    );
    const shouldCreateMinimalFile = parseBooleanAnswer(createMinimalAnswer, false);

    let removePreviousPackageFileFromFiles = false;
    if (previousPackageFilePath && previousPackageFilePath !== packageFilePath) {
      const removeAnswer = await ask(
        rl,
        `Remove previous package file ${previousPackageFilePath} from package.json.files? [no]: `
      );
      removePreviousPackageFileFromFiles = parseBooleanAnswer(removeAnswer, false);
    }

    return {
      ...config,
      docLink: {
        ...(config.docLink || {}),
        packageFilePath,
        repositoryUrlPath,
        shouldCreateMinimalFile,
        previousPackageFilePath,
        removePreviousPackageFileFromFiles,
      },
    };
  } finally {
    rl.close();
  }
}

module.exports = {
  collectRemoteInput,
  collectDocLinkInput,
  loadPackageJson,
  parsePackageFilePathFromVersionScript,
  parseRepositoryUrlPathFromVersionScript,
};
