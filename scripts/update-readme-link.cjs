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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  if (match) {
    return match[1];
  }

  match = url.match(/^git@github\.com:([^/]+\/[^/]+)$/);
  if (match) {
    return match[1];
  }

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

  if (!version || typeof version !== "string") {
    fail("package.json has no valid version field");
  }

  if (!npmPackage || typeof npmPackage !== "string") {
    fail("package.json has no valid name field");
  }

  const siteUrl = `https://${repo.split("/")[0]}.github.io/${repo.split("/")[1]}/readme-resolver.html`;

  const readme = fs.readFileSync(README_PATH, "utf8");

  const startCount =
    (readme.match(new RegExp(escapeRegExp(START_MARKER), "g")) || []).length;
  const endCount =
    (readme.match(new RegExp(escapeRegExp(END_MARKER), "g")) || []).length;

  if (startCount === 0 || endCount === 0) {
    fail(
      `Managed documentation block not found. Expected markers ${START_MARKER} and ${END_MARKER}`,
    );
  }

  if (startCount !== 1 || endCount !== 1) {
    fail("Managed documentation block markers must each appear exactly once");
  }

  const blockRegex = new RegExp(
    `${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`,
    "m",
  );

  const managedBlock =
    `${START_MARKER}` +
    `<a href="${siteUrl}?mode=last&pkg=${encodeURIComponent(npmPackage)}&repo=${encodeURIComponent(repo)}&v=${encodeURIComponent(version)}">` +
    `<img alt="README-last of ${version}" src="https://img.shields.io/badge/README-last%20of%20${encodeURIComponent(version)}-blue?logo=github">` +
    `</a>` +
    `${END_MARKER}`;

  const updated = readme.replace(blockRegex, managedBlock);

  if (updated === readme) {
    fail("README.md was not updated");
  }

  fs.writeFileSync(README_PATH, updated);
  console.log(`✅ README documentation badge updated to version ${version}`);
  console.log(`   repo=${repo}`);
  console.log(`   pkg=${npmPackage}`);
}

main();
