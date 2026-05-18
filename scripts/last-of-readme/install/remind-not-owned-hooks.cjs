#!/usr/bin/env node

const {
  printConvenienceHookReminder,
} = require('../driven-adapters/user-input-adapter.cjs');

function remindAboutConvenienceHooks(pipelineState) {
  const convenienceNeeds = (pipelineState.control || {}).convenienceNeeds || [];

  for (const need of convenienceNeeds) {
    printConvenienceHookReminder(need);
  }
}

module.exports = {
  remindAboutConvenienceHooks,
};
