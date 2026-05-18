#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const COMMANDS = {
  install: 'install/install.cjs',
  'check-contract': 'driving-adapters/check-contract.cjs',
  'tag-doc': 'driving-adapters/tag-doc.cjs',
  'update-readme-link': 'driving-adapters/update-readme-link.cjs',
  contract: 'driving-adapters/last-of-readme-contract.cjs',
  'attempt-check-contract': 'driving-adapters/attempt-check-contract.cjs',
  'attempt-successor-tag': 'driving-adapters/attempt-successor-tag.cjs',
  'attempt-readme-link': 'driving-adapters/attempt-readme-link.cjs',
};

function usage() {
  console.error([
    'Usage: last-of-readme <command> [args]',
    '',
    'Commands:',
    '  install',
    '  check-contract',
    '  tag-doc <last-of|successor-of|correction-of> [version] [--no-push]',
    '  update-readme-link [documentation-path] [url-path]',
    '  contract <until-next|until-next-warn|until-branch|until-branch-warn|correction-of>',
    '  attempt-check-contract',
    '  attempt-successor-tag',
    '  attempt-readme-link',
  ].join('\n'));
}

function resolveCwd(command) {
  if (command === 'install' && process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }

  return process.cwd();
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  const script = COMMANDS[command];

  if (!script) {
    usage();
    process.exit(command ? 1 : 0);
  }

  const scriptPath = path.resolve(__dirname, '..', script);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: resolveCwd(command),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`❌ Could not run last-of-readme ${command}: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
