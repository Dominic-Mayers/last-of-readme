#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { listRemoteChoices } = require('./install_remote.cjs');

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

function parseDocLinkPathFromVersionScript(versionScript) {
  if (typeof versionScript !== 'string') {
    return null;
  }

  const match = versionScript.match(
    /node\s+scripts\/update-readme-link\.cjs\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/
  );

  return match ? (match[1] || match[2] || match[3]) : null;
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

async function collectUserInput() {
  const packageJson = loadPackageJson();
  const previousDocLinkPath =
    parseDocLinkPathFromVersionScript(packageJson?.scripts?.version) || null;
  const defaultDocLinkPath = previousDocLinkPath || 'README.md';

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
        ? `Remote [${defaultRemoteName}]: `
        : 'Remote: '
    );
    const remoteName = resolveRemoteSelection(
      remoteAnswer,
      remoteChoices,
      defaultRemoteName
    );

    const pathAnswer = await ask(
      rl,
      `Doc-link file path [${defaultDocLinkPath}]: `
    );
    const docLinkPath = String(pathAnswer || '').trim() || defaultDocLinkPath;

    const createMinimalAnswer = await ask(
      rl,
      'Create a minimal file if it does not exist? [no]: '
    );
    const createMinimal = parseBooleanAnswer(createMinimalAnswer, false);

    let removePreviousDocLinkFromFiles = false;
    if (previousDocLinkPath && previousDocLinkPath !== docLinkPath) {
      const removeAnswer = await ask(
        rl,
        `Remove previous doc-link file ${previousDocLinkPath} from package.json.files? [no]: `
      );
      removePreviousDocLinkFromFiles = parseBooleanAnswer(removeAnswer, false);
    }

    return {
      config: {
        remoteName,
        docLinkPath,
        createMinimal,
        previousDocLinkPath,
        removePreviousDocLinkFromFiles,
      },
    };
  } finally {
    rl.close();
  }
}

module.exports = {
  collectUserInput,
  loadPackageJson,
  parseDocLinkPathFromVersionScript,
};
