/**
 * Helpers for application-command results.
 *
 * A command result is the small contract between the Last of Readme core and
 * its drivers.  The CLI driver prints the messages and exits with a status
 * code.  Tests can assert on the messages/effects.  A browser demo can render
 * the same result without reimplementing command behavior.
 *
 * Message objects describe what should be communicated to the user.
 * Effect objects describe what the command changed or observed in the
 * environment through its ports.
 */

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function commandSucceeded({
  changed = false,
  messages = [],
  effects = [],
  data = {},
} = {}) {
  return {
    ok: true,
    changed,
    messages: normalizeList(messages),
    effects: normalizeList(effects),
    ...data,
  };
}

function commandFailed(message, {
  messages = [],
  effects = [],
  data = {},
} = {}) {
  const failureMessage = typeof message === 'string'
    ? message
    : message && message.message
      ? message.message
      : String(message);

  return {
    ok: false,
    message: failureMessage,
    messages: normalizeList(messages),
    effects: normalizeList(effects),
    ...data,
  };
}

function commandMessage(kind, details = {}) {
  return {
    kind,
    ...details,
  };
}

function commandEffect(kind, details = {}) {
  return {
    kind,
    ...details,
  };
}

module.exports = {
  commandEffect,
  commandFailed,
  commandMessage,
  commandSucceeded,
};
