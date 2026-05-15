// Source for docs/demo.bundle.js.
//
// This first vertical slice intentionally keeps the demo shell simple. The
// browser-served bundle owns the fake package/git/npm/repository state and calls
// the real resolver core through window.LastOfReadmeResolver and the real
// link-building core through window.LastOfReadmeLinkUpdater.
//
// TODO: Replace docs/demo.bundle.js with a build artifact generated from this
// source once the demo build pipeline is introduced (Step 9).
