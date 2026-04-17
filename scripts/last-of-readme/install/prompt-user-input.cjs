#!/usr/bin/env node

const readline = require('readline');
const {
  gitRemoteNames,
  gitRemoteUrl,
  normalizeOptionalText,
} = require('./utils.cjs');

async function getUserInputRemoteChoice() {
  const remotes = getRemotesFromGit();
  const defaultRemoteName = chooseDefaultRemoteName(remotes);
  const rl = createInterface();

  try {
    console.log('Git remotes:');
    console.log(formatRemoteChoices(remotes));
    console.log('Select a remote by number or by name. Enter none to stop.');

    const remoteAnswer = await getUserInput(
      rl,
      defaultRemoteName
        ? `Remote to use for Last of Readme [${defaultRemoteName}]: `
        : 'Remote to use for Last of Readme: '
    );

    return resolveSelectedRemote(remoteAnswer, remotes, defaultRemoteName);
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

function getUserInput(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

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

module.exports = {
  askRemoteChoice,
};
