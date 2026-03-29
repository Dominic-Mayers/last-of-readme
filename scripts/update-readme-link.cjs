#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const README_PATH = path.join(process.cwd(), "README.md");
const PACKAGE_PATH = path.join(process.cwd(), "package.json");

const START_MARKER = "<!-- DOC-LINK-START -->";
const END_MARKER = "<!-- DOC-LINK-END -->";

const SITE_URL =
  "https://dominic-mayers.github.io/undo-manager-jit-tail/readme-resolver.html";

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

function main() {
  if (!fs.existsSync(README_PATH)) {
    fail("README.md not found");
  }

  if (!fs.existsSync(PACKAGE_PATH)) {
    fail("package.json not found");
  }

  const pkg = readJson(PACKAGE_PATH);
  const version = pkg.version;

  if (!version || typeof version !== "string") {
    fail("package.json has no valid version field");
  }

  const readme = fs.readFileSync(README_PATH, "utf8");

  const startCount = (readme.match(new RegExp(escapeRegExp(START_MARKER), "g")) || []).length;
  const endCount = (readme.match(new RegExp(escapeRegExp(END_MARKER), "g")) || []).length;

  if (startCount === 0 || endCount === 0) {
    fail(`Managed documentation block not found. Expected markers ${START_MARKER} and ${END_MARKER}`);
  }

  if (startCount !== 1 || endCount !== 1) {
    fail("Managed documentation block markers must each appear exactly once");
  }

  const blockRegex = new RegExp(
    `${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`,
    "m"
  );

  const managedBlock = `${START_MARKER}[![README-last of ${version}](https://img.shields.io/badge/README-last%20of%20${version}-blue?logo=github)](${SITE_URL}?mode=last&v=${version})${END_MARKER}`;

  const updated = readme.replace(blockRegex, managedBlock);

  if (updated === readme) {
    fail("README.md was not updated");
  }

  fs.writeFileSync(README_PATH, updated);
  console.log(`✅ README documentation badge updated to version ${version}`);
}

main();
