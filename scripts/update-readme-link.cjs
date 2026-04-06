#!/usr/bin/env node

const workspace = require('./local-workspace-api.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';
const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function usage() {
  console.error('Usage: node update-readme-link.cjs <documentation-path> <doc-tag-suffix>');
  process.exit(1);
}

function buildResolverLink(docTagSuffix) {
  const version = workspace.currentPackageVersion();
  const packageName = workspace.packageName();
  const repository = workspace.remoteRepository();

  const [owner, repoName] = repository.split('/');
  const siteUrl = `https://${owner}.github.io/${repoName}/readme-resolver.html`;

  return (
    `<a href="${siteUrl}?mode=last&pkg=${encodeURIComponent(packageName)}` +
    `&repo=${encodeURIComponent(repository)}&v=${encodeURIComponent(version)}` +
    `&docTagSuffix=${encodeURIComponent(docTagSuffix)}">` +
    `<img alt="README-last of ${version}" ` +
    `src="https://img.shields.io/badge/README-last%20of%20${encodeURIComponent(version)}-blue?logo=github">` +
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

function main() {
  const documentationPath = process.argv[2];
  const docTagSuffix = process.argv[3];

  if (!documentationPath || !docTagSuffix) {
    usage();
  }

  try {
    const link = buildResolverLink(docTagSuffix);
    const content = workspace.readFile(documentationPath);
    const updatedContent = replaceManagedBlock(content, link);
    workspace.writeFile(documentationPath, updatedContent);
    console.log(`✅ ${documentationPath} updated for version ${workspace.currentPackageVersion()}`);
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
