#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const PACKAGE_PATH = path.join(process.cwd(), "package.json");
const ALLOWED_KINDS = new Set(["last-doc", "next-doc"]);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function run(command, options = {}) {
  return cp.execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    fail(`Could not read ${path.basename(filePath)}: ${err.message}`);
  }
}

function gitTagExists(tag) {
  try {
    run(`git rev-parse -q --verify refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}

function ensureGitRepo() {
  try {
    run("git rev-parse --is-inside-work-tree");
  } catch {
    fail("Current directory is not a Git repository");
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const push = !args.includes("--no-push");
  const positional = args.filter((arg) => !arg.startsWith("--"));

  if (positional.length !== 1) {
    fail("Usage: node scripts/tag-doc.cjs <last-doc|next-doc> [--no-push]");
  }

  const kind = positional[0];

  if (!ALLOWED_KINDS.has(kind)) {
    fail(`Unknown doc tag kind: ${kind}`);
  }

  return { kind, push };
}

function main() {
  ensureGitRepo();

  if (!fs.existsSync(PACKAGE_PATH)) {
    fail("package.json not found");
  }

  const { kind, push } = parseArgs(process.argv);
  const pkg = readJson(PACKAGE_PATH);
  const version = pkg.version;

  if (!version) {
    fail("package.json has no version");
  }

  const tag = `v${version}-${kind}`;

  if (gitTagExists(tag)) {
    fail(`Tag already exists: ${tag}`);
  }

  const message =
    kind === "last-doc"
      ? `Last README commit for version ${version}`
      : `Next README anchor for version ${version}`;

  cp.execSync(
    `git tag -a ${JSON.stringify(tag)} -m ${JSON.stringify(message)}`,
    { stdio: "inherit" }
  );

  console.log(`✅ Created tag ${tag}`);

  if (push) {
    cp.execSync(`git push origin ${JSON.stringify(tag)}`, {
      stdio: "inherit",
    });
    console.log(`✅ Pushed tag ${tag}`);
  } else {
    console.log("ℹ️ Tag not pushed");
  }
}

main();
