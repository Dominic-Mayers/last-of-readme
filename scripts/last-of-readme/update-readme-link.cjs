#!/usr/bin/env node

// Phase 1: centralized resolver (try-it mode)
// Must NOT depend on target repository hosting
const CENTRAL_RESOLVER_URL = 'https://dominic-mayers.github.io/last-of-readme/readme-resolver.html';

const { 
    packageFilePath,
    repositoryUrlPath,
    currentPackageVersion,
    packageName,
    remoteConfiguration,
    configuredNextDocumentationContract
} = require('./adapters/npm-adapter.cjs');

const {
    readPackageFileContent,
    writePackageFileContent
} = require('./adapters/filesystem-adapter.cjs');

const {
  formatUpdateReadmeLinkUsage,
  printAbortMessage,
  printPackageFileUpdatedForVersion,
} = require('./adapters/prompt-user-input.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function fail(message) {
  printAbortMessage(message);
  process.exit(1);
}

function usage() {
  printAbortMessage(formatUpdateReadmeLinkUsage());
  process.exit(1);
}

function resolveInputs() {
  const cliDocumentationPath = process.argv[2];
  const cliUrlPath = process.argv[3] || '';

  if (cliDocumentationPath) {
    return {
      documentationPath: cliDocumentationPath,
      urlPath: cliUrlPath,
    };
  }

  return {
    documentationPath: packageFilePath(),
    urlPath: repositoryUrlPath(),
  };
}

function buildResolverLink(urlPath = '') {
  const version = currentPackageVersion();
  const pckName = packageName();
  const remote  = remoteConfiguration();
  const documentationContract = configuredNextDocumentationContract();
  const badgeMessage = `${documentationContract} ${version}`; 
  const badgeUrl = `https://img.shields.io/badge/README-${encodeBadgeField(badgeMessage)}-blue?logo=github`;
  
  return (
    `<a href="${CENTRAL_RESOLVER_URL}?mode=last&pkg=${encodeURIComponent(pckName)}` +
    `&contract=${encodeURIComponent(documentationContract)}` +
    `&repositoryApiUrl=${encodeURIComponent(remote.repositoryApiUrl)}` +
    `&repositoryBrowserUrl=${encodeURIComponent(remote.repositoryBrowserUrl)}` +
    `&v=${encodeURIComponent(version)}` +
    `&urlPath=${encodeURIComponent(urlPath)}">` +
    `<img alt="README ${documentationContract} ${version}" ` +
    `src="${badgeUrl}">` +
    `</a>`
  );
}

function findManagedPlaceholder(content) {
  let offset = 0;

  while (offset <= content.length) {
    const placeholderStart = content.indexOf(START_MARKER, offset);
    if (placeholderStart === -1) {
      throw new Error('Managed placeholder not found outside example regions');
    }

    const placeholderEnd = content.indexOf(END_MARKER, placeholderStart + START_MARKER.length);
    if (placeholderEnd === -1) {
      throw new Error('Unclosed placeholder block');
    }

    const exampleStart = content.indexOf(EXAMPLE_START_MARKER, offset);
    if (exampleStart === -1) {
      return {
        start: placeholderStart,
        end: placeholderEnd,
      };
    }

    const exampleEnd = content.indexOf(EXAMPLE_END_MARKER, exampleStart + EXAMPLE_START_MARKER.length);
    if (exampleEnd === -1) {
      throw new Error('Unclosed example region');
    }

    if (placeholderEnd < exampleStart) {
      return {
        start: placeholderStart,
        end: placeholderEnd,
      };
    }

    offset = exampleEnd + EXAMPLE_END_MARKER.length;
  }

  throw new Error('Managed placeholder not found outside example regions');
}

function replaceManagedBlock(content, replacement) {
  const { start, end } = findManagedPlaceholder(content);
  const managedBlock = `${START_MARKER}${replacement}${END_MARKER}`;
  const before = content.slice(0, start);
  const after = content.slice(end + END_MARKER.length);
  return before + managedBlock + after;
}

function encodeBadgeField(value) {
  return encodeURIComponent(value).replace(/-/g, '--');
}

function main() {
  const { documentationPath, urlPath } = resolveInputs();

  try {
    const link = buildResolverLink(urlPath);
    const content = readPackageFileContent(documentationPath);
    const updatedContent = replaceManagedBlock(content, link);
    writePackageFileContent(documentationPath, updatedContent);
    printPackageFileUpdatedForVersion(documentationPath, currentPackageVersion());
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
