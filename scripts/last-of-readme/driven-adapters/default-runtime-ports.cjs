/**
 * Default Last of Readme runtime ports.
 *
 * This module is the composition root for the Node CLI/npm runtime.  The
 * application commands should depend on the returned port object, not on these
 * concrete adapters directly.  Other runtimes, such as tests or a browser demo,
 * can provide another object with the same port shape.
 */

function createDefaultRuntimePorts() {
  return {
    npm: require('./npm-adapter.cjs'),
    git: require('./git-adapter.cjs'),
    filesystem: require('./filesystem-adapter.cjs'),
    userInput: require('./prompt-user-input.cjs'),
    registry: require('./registry-adapter.cjs'),
  };
}

module.exports = {
  createDefaultRuntimePorts,
};
