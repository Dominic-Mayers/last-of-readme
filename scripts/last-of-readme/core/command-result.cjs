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
 *
 * Failure objects describe why a command failed in a stable, machine-readable
 * way while preserving the user-facing message used by CLI drivers.
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

function normalizeFailureMessage(value) {
  return typeof value === 'string'
    ? value
    : value && value.message
      ? value.message
      : String(value);
}

function commandFailure(kind, details = {}) {
  return {
    kind,
    ...details,
  };
}

function commandFailed(message, {
  failureKind = 'command-failed',
  messages = [],
  effects = [],
  data = {},
  cause,
} = {}) {
  const failureMessage = normalizeFailureMessage(message);
  const causeMessage = cause ? normalizeFailureMessage(cause) : undefined;
  const failure = commandFailure(failureKind, {
    message: failureMessage,
    ...(causeMessage ? { causeMessage } : {}),
  });

  return {
    ok: false,
    changed: false,
    failureKind,
    failure,
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
  commandFailure,
  commandMessage,
  commandSucceeded,
};
