#!/usr/bin/env node

const {
  getLastOfReadmeConfig,
} = require('./adapters/npm-adapter.cjs');

const {
  askWhetherToContinueAfterFailure,
  isInteractiveSession,
  displayNonInteractiveFailureWarning,
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
