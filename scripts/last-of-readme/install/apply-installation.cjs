#!/usr/bin/env node

const {
  getCurrentFilesField,
  getCurrentScriptsHooks,
  updatePackageJsonFields,
} = require('../adapters/npm-adapter.cjs');
const {
  createPackageFileIfAbsent,
} = require('../adapters/filesystem-adapter.cjs');
const { START_MARKER, END_MARKER } = require('./step-logic-filesystem.cjs');
const {
  interactivelyInstallFingerprintedHook,
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
  printConvenienceHookReminder,
} = require('../adapters/user-input-adapter.cjs');

// Fingerprinted Last of Readme commands per hook.
// User-visible explanations for these commands live in prompt-user-input.cjs.
const LOR_HOOK_COMMANDS = {
  preversion: {
    command:
      'node scripts/last-of-readme/check-contract.cjs && node scripts/last-of-readme/tag-doc.cjs successor-of',
  },
  version: {
    command: 'node scripts/last-of-readme/update-readme-link.cjs',
  },
};

async function automatedInstall(pipelineState) {
  installDocLink(pipelineState);
  installRemotePackageJson(pipelineState);
  installDocLinkPackageJson(pipelineState);
  await installScriptsHooks(pipelineState);
}

function setPackageJsonFields(updates) {
  updatePackageJsonFields(updates);
}

function installRemotePackageJson(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const remoteConfig = config.remote || {};
  const remoteName = config.remoteName;

  if (!remoteName || !control.repositoryUrl) {
    throw new Error('Remote installation requires resolved remote cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.remoteName': remoteName,
    'lastOfReadme.remote.kind': remoteConfig.kind,
    'lastOfReadme.remote.repositoryApiUrl':
      remoteConfig.repositoryApiUrl,
    'lastOfReadme.remote.repositoryBrowserUrl':
      remoteConfig.repositoryBrowserUrl,
  });

  return {
    path: 'package.json',
    remote: {
      localName: remoteName,
      kind: remoteConfig.kind,
      repositoryApiUrl: remoteConfig.repositoryApiUrl,
      repositoryBrowserUrl: remoteConfig.repositoryBrowserUrl,
    },
  };
}

function installDocLinkPackageJson(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const packageFilePath = config.packageFilePath;

  if (!packageFilePath) {
    throw new Error('Doc-link package.json installation requires resolved doc-link cycle state');
  }

  setPackageJsonFields({
    'lastOfReadme.packageFilePath': packageFilePath,
    ...(typeof config.repositoryUrlPath === 'string'
      ? { 'lastOfReadme.repositoryUrlPath': config.repositoryUrlPath }
      : {}),
  });

  const currentFiles = getCurrentFilesField();
  const updatedFiles = updateFilesField(
    currentFiles,
    packageFilePath,
    control.previousPackageFilePath,
    Boolean(control.removePreviousPackageFileFromFiles)
  );

  if (updatedFiles !== null) {
    setPackageJsonFields({
      files: updatedFiles,
    });
  }

  return {
    path: 'package.json',
    packageFilePath,
    filesChanged: updatedFiles !== null,
  };
}

// TODO: The return value is not currently used by the installer.
// Decide whether installation steps should report results in a structured way.
function installDocLink(pipelineState = {}) {
  const config = pipelineState.config || {};
  const control = pipelineState.control || {};
  const packageFilePath = config.packageFilePath;

  if (!packageFilePath || !control.mode) {
    throw new Error('Doc-link installation requires resolved doc-link cycle state');
  }

  if (control.mode === 'existing-file') {
    return {
      mode: 'existing-file',
      path: packageFilePath,
      changed: false,
    };
  }

  const minimalContent = `Last of Readme : ${START_MARKER}${END_MARKER}
`;
  createPackageFileIfAbsent(packageFilePath, minimalContent);

  return {
    mode: 'created-minimal-file',
    path: packageFilePath,
    changed: true,
  };
}

function updateFilesField(
  currentFiles,
  packageFilePath,
  previousPackageFilePath,
  shouldRemovePrevious
) {
  if (!Array.isArray(currentFiles)) {
    return null;
  }

  const updatedFiles = [...currentFiles];

  if (!updatedFiles.includes(packageFilePath)) {
    updatedFiles.push(packageFilePath);
  }

  if (
    shouldRemovePrevious &&
    typeof previousPackageFilePath === 'string' &&
    previousPackageFilePath !== packageFilePath
  ) {
    return updatedFiles.filter((item) => item !== previousPackageFilePath);
  }

  return updatedFiles;
}


function stripLorCommand(hookContent, lorCommand) {
  if (!hookContent) return '';
  return hookContent
    .replace(new RegExp(`\\s*&&\\s*${escapeRegExp(lorCommand)}`, 'g'), '')
    .replace(new RegExp(`${escapeRegExp(lorCommand)}\\s*&&\\s*`, 'g'), '')
    .replace(new RegExp(`^${escapeRegExp(lorCommand)}$`), '')
    .trim();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function installScriptsHooks(pipelineState) {
  const currentHooks = getCurrentScriptsHooks();
  const convenienceNeeds = (pipelineState.control || {}).convenienceNeeds || [];

  for (const hook of ['preversion', 'version', 'postversion']) {
    const lorEntry = LOR_HOOK_COMMANDS[hook] || null;
    const rawContent = currentHooks[hook] || '';

    const remainingContent = lorEntry
      ? stripLorCommand(rawContent, lorEntry.command)
      : rawContent;

    if (lorEntry) {
      await installFingerprintedHookCommand({ hook, lorEntry, remainingContent });
    }
  }

  // Print reminders for convenience commands the user acknowledged in the pipeline.
  for (const need of convenienceNeeds) {
    printConvenienceHookReminder(need);
  }
}

async function installFingerprintedHookCommand({ hook, lorEntry, remainingContent }) {
  if (!remainingContent) {
    setPackageJsonFields({ [`scripts.${hook}`]: lorEntry.command });
    printFingerprintedHookInstalled(hook);
    return;
  }

  const choice = await interactivelyInstallFingerprintedHook({
    hook,
    command: lorEntry.command,
    remainingContent,
  });

  if (choice === 'prepend') {
    setPackageJsonFields({
      [`scripts.${hook}`]: `${lorEntry.command} && ${remainingContent}`,
    });
    printFingerprintedHookPrepended(hook);
  }
  // 'manual': reminder already printed by prompt-user-input.cjs.
}


module.exports = {
  automatedInstall,
};
