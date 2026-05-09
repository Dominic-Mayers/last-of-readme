#!/usr/bin/env node

const {
  assertCanDryRunPublishTag,
  getRemotesFromGit,
} = require('../adapters/git-adapter.cjs');

function collectGitRemotesEnvironmentInput(pipelineState = {}) {
  return {
    ...pipelineState,
    control: {
      ...(pipelineState.control || {}),
      availableRemotes: getRemotesFromGit(),
    },
  };
}

function checkRemoteNameConfigRequirements(pipelineState = {}) {
  return pipelineState;
}

function finalizeRemoteNameState(pipelineState = {}) {
  const control = pipelineState.control || {};
  const config = pipelineState.config || {};

  return {
    ...pipelineState,
    config: {
      ...config,
      remoteName: control.localName,
    },
  };
}

function checkGitRemoteRequirements(pipelineState = {}) {
  const control = pipelineState.control || {};
  const localName = control.localName;

  if (!localName || typeof localName !== 'string') {
    throw new Error('A Git remote must be selected for Last of Readme');
  }

  const repositoryUrl = control.repositoryUrl;

  if (!repositoryUrl) {
    throw new Error(`Selected Git remote does not exist: ${localName}`);
  }

  console.log("localName: ", localName ); 

  assertCanDryRunPublishTag(localName);

  console.log("control.repositoryApiUrl: ", control.repositoryApiUrl); 
  assertHttpUrl(
    control.repositoryApiUrl,
    'A GitHub repository API URL must be provided for Last of Readme'
  );
  
  console.log("control.repositoryBrowserUrl: ", control.repositoryBrowserUrl ); 

  assertHttpUrl(
    control.repositoryBrowserUrl,
    'A GitHub repository browser URL must be provided for Last of Readme'
  );

  return pipelineState;
}

function finalizeRemoteState(pipelineState = {}) {
  const control = pipelineState.control || {};
  const config = pipelineState.config || {};

  return {
    ...pipelineState,
    config: {
      ...config,
      remote: {
        ...(config.remote || {}),
        kind: 'github',
        repositoryApiUrl: control.repositoryApiUrl,
        repositoryBrowserUrl: control.repositoryBrowserUrl,
      },
    },
  };
}

function assertHttpUrl(value, message) {
  if (!value || typeof value !== 'string') {
    throw new Error(message);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${message}: ${value}`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${message}: ${value}`);
  }
}

module.exports = {
  collectGitRemotesEnvironmentInput,
  checkRemoteNameConfigRequirements,
  finalizeRemoteNameState,
  checkGitRemoteRequirements,
  finalizeRemoteState,
};
