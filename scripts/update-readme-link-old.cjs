#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const README_PATH = path.join(process.cwd(), "README.md");
const PACKAGE_PATH = path.join(process.cwd(), "package.json");

const START_MARKER = "<!-- DOC-LINK-START -->";
const END_MARKER = "<!-- DOC-LINK-END -->";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    fail(`Could not read ${path.basename(filePath)}: ${err.message}`);
  }
}

function normalizeRepositoryUrl(repository) {
  let url =
    typeof repository === "string"
      ? repository
      : repository && typeof repository.url === "string"
        ? repository.url
        : null;

  if (!url) {
    fail("package.json has no valid repository.url");
  }

  url = url.trim();

  if (url.startsWith("git+")) {
    url = url.slice(4);
  }

  if (url.endsWith(".git")) {
    url = url.slice(0, -4);
  }

  let match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)$/);
  if (match) return match[1];

  match = url.match(/^git@github\.com:([^/]+\/[^/]+)$/);
  if (match) return match[1];

  fail("repository.url must point to a GitHub repository");
}

function main() {
  if (!fs.existsSync(README_PATH)) {
    fail("README.md not found");
  }

  if (!fs.existsSync(PACKAGE_PATH)) {
    fail("package.json not found");
  }

  const pkg = readJson(PACKAGE_PATH);

  const version = pkg.version;
  const npmPackage = pkg.name;
  const repo = normalizeRepositoryUrl(pkg.repository);

  if (!version) fail("package.json has no version");
  if (!npmPackage) fail("package.json has no name");

  const [owner, repoName] = repo.split("/");

  const siteUrl = `https://${owner}.github.io/${repoName}/readme-resolver.html`;

  const docTagSuffix = pkg.lastOfReadme?.docTagSuffix || "-last-doc";

  const badge =
    `<a href="${siteUrl}?mode=last&pkg=${encodeURIComponent(
      npmPackage,
    )}&repo=${encodeURIComponent(repo)}&v=${encodeURIComponent(
      version,
    )}&docTagSuffix=${encodeURIComponent(docTagSuffix)}">` +
    `<img alt="README-last of ${version}" src="https://img.shields.io/badge/README-last%20of%20${encodeURIComponent(
      version,
    )}-blue?logo=github">` +
    `</a>`;

  const managedBlock = `${START_MARKER}${badge}${END_MARKER}`;

  const readme = fs.readFileSync(README_PATH, "utf8");

  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);

  if (start === -1 || end === -1) {
    fail("Placeholder not found");
  }

  if (end < start) {
    fail("Invalid placeholder order");
  }

  const before = readme.slice(0, start);
  const after = readme.slice(end + END_MARKER.length);

  const updated = before + managedBlock + after;

  fs.writeFileSync(README_PATH, updated);

  console.log(`✅ README updated for version ${version}`);
}

main();
