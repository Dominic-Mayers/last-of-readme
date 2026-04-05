#!/usr/bin/env node

const workspace = require('./local-workspace-api.cjs');

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';

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

function replaceManagedBlock(content, replacement) {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  if (start === -1 || end === -1) {
    throw new Error('Placeholder not found');
  }

  if (end < start) {
    throw new Error('Invalid placeholder order');
  }

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
