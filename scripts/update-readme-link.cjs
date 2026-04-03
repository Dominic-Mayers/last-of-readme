#!/usr/bin/env node

const workspace = require('./local-workspace-api.cjs');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function buildResolverLink() {
  const version = workspace.currentPackageVersion();
  const packageName = workspace.currentPackageName();
  const repository = workspace.currentRepository();
  const docTagSuffix = workspace.packageSetting(['lastOfReadme', 'docTagSuffix'], '-last-doc');

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

function main() {
  try {
    const link = buildResolverLink();
    const version = workspace.currentPackageVersion();
    workspace.replaceDocumentationLink(link);
    console.log(`✅ README updated for version ${version}`);
  } catch (err) {
    fail(err && err.message ? err.message : String(err));
  }
}

main();
