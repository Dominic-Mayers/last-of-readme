#!/usr/bin/env node

const {
  getLastOfReadmeConfig,
} = require('./adapters/npm-adapter.cjs');

const {
  askWhetherToContinueAfterFailure,
  isInteractiveSession,
  displayNonInteractiveFailureWarning,
  displayLifecycleFailureWarning,
} = require('./adapters/user-input-adapter.cjs');

async function runAttempt(operationName, callback) {
  try {
    await callback();
  } catch (error) {
    if (isInteractiveSession()) {
      const shouldContinue = await askWhetherToContinueAfterFailure({
        operationName,
        error,
      });

      if (!shouldContinue) {
        throw error;
      }

      return;
    }

    if (process.env.npm_lifecycle_event) {
      const config = getLastOfReadmeConfig();
      if ((config.nonInteractiveFailurePolicy || 'continue') === 'abort') {
        throw error;
      }
      displayLifecycleFailureWarning({ operationName, error });
      return;
    }

    const config = getLastOfReadmeConfig();
    const policy = config.nonInteractiveFailurePolicy || 'continue';

    if (policy === 'abort') {
      throw error;
    }

    displayNonInteractiveFailureWarning({
      operationName,
      policy,
    });
  }
}

module.exports = {
  runAttempt,
};
