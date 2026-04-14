const { spawnSync } = require('child_process');

/**
 * Run `npm pkg ...` and return raw text or parsed JSON.
 *
 * @param {string[]} args
 * @param {object} [options]
 * @param {string} [options.cwd] - Working directory for npm. Defaults to process.cwd().
 * @param {boolean} [options.expectJson=false] - Parse stdout as JSON.
 * @param {boolean} [options.allowFailure=false] - Return null instead of throwing on command failure.
 * @param {boolean} [options.allowEmpty=false] - Allow empty stdout. Returns undefined if empty.
 * @param {string} [options.failureMessage] - Prefix for thrown errors.
 * @returns {string|unknown|null|undefined}
 */
function runNpmPkg(
  args,
  {
    cwd = process.cwd(),
    expectJson = false,
    allowFailure = false,
    allowEmpty = false,
    failureMessage,
  } = {}
) {
  const commandText = `npm pkg ${args.join(' ')}`;
  const prefix = failureMessage ?? commandText;

  const result = spawnSync('npm', ['pkg', ...args], {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    if (allowFailure) {
      return null;
    }
    throw new Error(`${prefix}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    if (allowFailure) {
      return null;
    }
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${prefix} failed${detail ? `: ${detail}` : ''}`);
  }

  const raw = result.stdout ?? '';
  const trimmed = raw.trim();

  if (trimmed === '') {
    if (allowEmpty) {
      return undefined;
    }
    throw new Error(`${prefix} returned no output`);
  }

  if (!expectJson) {
    return trimmed;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(`${prefix}: could not parse JSON: ${message}`);
  }
}

module.exports = {
  runNpmPkg,
};
