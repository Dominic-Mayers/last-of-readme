#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const PACKAGE_PATH = path.join(process.cwd(), "package.json");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function run(command) {
  return cp.execSync(command, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    fail(`Could not read ${path.basename(filePath)}: ${err.message}`);
  }
}

function tagExists(tag) {
  try {
    run(`git rev-parse -q --verify refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const PACKAGE_PATH = path.join(process.cwd(), "package.json");
const DOC_TAG_SUFFIX = "-last-doc";

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

function main() {
  ensureGitRepo();

  if (!fs.existsSync(PACKAGE_PATH)) {
    fail("package.json not found");
  }

  const pkg = readJson(PACKAGE_PATH);
  const version = pkg.version;

  if (!version) {
    fail("package.json has no version");
  }

  const push = !process.argv.includes("--no-push");
  const tag = `v${version}${DOC_TAG_SUFFIX}`;

  if (gitTagExists(tag)) {
    fail(`Tag already exists: ${tag}`);
  }

  const message = `Last README commit for version ${version}`;

  cp.execSync(
    `git tag -a ${JSON.stringify(tag)} -m ${JSON.stringify(message)}`,
    { stdio: "inherit" },
  );

  console.log(`✅ Created tag ${tag}`);

  if (push) {#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const PACKAGE_PATH = path.join(process.cwd(), "package.json");
const DOC_TAG_SUFFIX = "-last-doc";

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

function main() {
  ensureGitRepo();

  if (!fs.existsSync(PACKAGE_PATH)) {
    fail("package.json not found");
  }

  const pkg = readJson(PACKAGE_PATH);
  const version = pkg.version;

  if (!version) {
    fail("package.json has no version");
  }

  const push = !process.argv.includes("--no-push");
  const tag = `v${version}${DOC_TAG_SUFFIX}`;

  if (gitTagExists(tag)) {
    fail(`Tag already exists: ${tag}`);
  }

  const message = `Last README commit for version ${version}`;

  cp.execSync(
    `git tag -a ${JSON.stringify(tag)} -m ${JSON.stringify(message)}`,
    { stdio: "inherit" },
  );

  console.log(`✅ Created tag ${tag}`);

  if (push) {
    cp.execSync(`git push origin ${JSON.stringify(tag)}`, {
      stdio: "inherit",
    });
    console.log(`✅ Pushed tag ${tag}`);
  } else {
    console.log(`ℹ️ Tag not pushed`);
  }
}

main();
    cp.execSync(`git push origin ${JSON.stringify(tag)}`, {
      stdio: "inherit",
    });
    console.log(`✅ Pushed tag ${tag}`);
  } else {
    console.log(`ℹ️ Tag not pushed`);
  }
}

main();
function main() {
  const pkg = readJson(PACKAGE_PATH);
  const version = pkg.version;
  const suffix = pkg.lastOfReadme?.docTagSuffix || "-last-doc";

  if (!version) fail("package.json has no version");

  const tag = `v${version}${suffix}`;

  if (tagExists(tag)) {
    fail(`Tag already exists: ${tag}`);
  }

  cp.execSync(
    `git tag -a ${JSON.stringify(tag)} -m ${JSON.stringify(`Last README for ${version}`)}`,
    { stdio: "inherit" }
  );

  console.log(`✅ Created tag ${tag}`);
  console.log(`Push it with: git push origin ${tag}`);
}

main();
