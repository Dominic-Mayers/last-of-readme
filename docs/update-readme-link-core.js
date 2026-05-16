/*
 * Core update-readme-link logic.
 *
 * Mirrors the pure functions of update-readme-link.cjs in a browser-loadable
 * IIFE so that demo.html can call the real link-building and placeholder logic
 * through injected ports, without a build pipeline.
 *
 * Exposes window.LastOfReadmeLinkUpdater:
 *
 *   runUpdateReadmeLink({ args, ports })
 *   buildResolverLink({ urlPath, ports })
 *   findManagedPlaceholder(content)
 *   replaceManagedBlock(content, replacement)
 *   encodeBadgeField(value)
 *   START_MARKER, END_MARKER, EXAMPLE_START_MARKER, EXAMPLE_END_MARKER
 *
 * The ports object must implement:
 *   ports.npm.currentPackageVersion()
 *   ports.npm.packageName()
 *   ports.npm.remoteConfiguration()          → { repositoryApiUrl, repositoryBrowserUrl }
 *   ports.npm.configuredNextDocumentationContract()
 *   ports.npm.packageFilePath()
 *   ports.npm.repositoryUrlPath()
 *   ports.filesystem.readPackageFileContent(path)
 *   ports.filesystem.writePackageFileContent(path, content)
 */
(function defineReadmeResolverLinkCore(global) {
  const START_MARKER = '<!-- DOC-LINK-START -->';
  const END_MARKER = '<!-- DOC-LINK-END -->';
  const EXAMPLE_START_MARKER = '<!-- DOC-LINK-EXAMPLE-START -->';
  const EXAMPLE_END_MARKER = '<!-- DOC-LINK-EXAMPLE-END -->';
  const CENTRAL_RESOLVER_URL = 'https://dominic-mayers.github.io/last-of-readme/readme-resolver-driver.html';

  function encodeBadgeField(value) {
    return encodeURIComponent(value).replace(/-/g, '--');
  }

  function findManagedPlaceholder(content) {
    let offset = 0;

    while (offset <= content.length) {
      const placeholderStart = content.indexOf(START_MARKER, offset);
      if (placeholderStart === -1) {
        throw new Error('Managed placeholder not found outside example regions');
      }

      const placeholderEnd = content.indexOf(END_MARKER, placeholderStart + START_MARKER.length);
      if (placeholderEnd === -1) {
        throw new Error('Unclosed placeholder block');
      }

      const exampleStart = content.indexOf(EXAMPLE_START_MARKER, offset);
      if (exampleStart === -1) {
        return { start: placeholderStart, end: placeholderEnd };
      }

      const exampleEnd = content.indexOf(EXAMPLE_END_MARKER, exampleStart + EXAMPLE_START_MARKER.length);
      if (exampleEnd === -1) {
        throw new Error('Unclosed example region');
      }

      if (placeholderEnd < exampleStart) {
        return { start: placeholderStart, end: placeholderEnd };
      }

      offset = exampleEnd + EXAMPLE_END_MARKER.length;
    }

    throw new Error('Managed placeholder not found outside example regions');
  }

  function replaceManagedBlock(content, replacement) {
    const { start, end } = findManagedPlaceholder(content);
    const managedBlock = `${START_MARKER}${replacement}${END_MARKER}`;
    const before = content.slice(0, start);
    const after = content.slice(end + END_MARKER.length);
    return before + managedBlock + after;
  }

  function buildResolverLink({ urlPath = '', ports }) {
    const version = ports.npm.currentPackageVersion();
    const pckName = ports.npm.packageName();
    const remote = ports.npm.remoteConfiguration();
    const documentationContract = ports.npm.configuredNextDocumentationContract();
    const badgeMessage = `${documentationContract} ${version}`;
    const badgeUrl = `https://img.shields.io/badge/README-${encodeBadgeField(badgeMessage)}-blue?logo=github`;

    return (
      `<a href="${CENTRAL_RESOLVER_URL}?mode=last&pkg=${encodeURIComponent(pckName)}` +
      `&contract=${encodeURIComponent(documentationContract)}` +
      `&repositoryApiUrl=${encodeURIComponent(remote.repositoryApiUrl)}` +
      `&repositoryBrowserUrl=${encodeURIComponent(remote.repositoryBrowserUrl)}` +
      `&v=${encodeURIComponent(version)}` +
      `&urlPath=${encodeURIComponent(urlPath)}">` +
      `<img alt="README ${documentationContract} ${version}" src="${badgeUrl}">` +
      `</a>`
    );
  }

  function resolveInputs({ args, ports }) {
    const cliDocumentationPath = args[0];
    const cliUrlPath = args[1] || '';

    if (cliDocumentationPath) {
      return { ok: true, documentationPath: cliDocumentationPath, urlPath: cliUrlPath };
    }

    return {
      ok: true,
      documentationPath: ports.npm.packageFilePath(),
      urlPath: ports.npm.repositoryUrlPath(),
    };
  }

  // Minimal command-result helpers — kept in sync with core/command-result.cjs.
  function normalizeList(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function commandSucceeded({ changed = false, messages = [], effects = [], data = {} } = {}) {
    return { ok: true, changed, messages: normalizeList(messages), effects: normalizeList(effects), ...data };
  }

  function commandFailed(message, { failureKind = 'command-failed' } = {}) {
    const msg = typeof message === 'string' ? message
      : (message && message.message ? message.message : String(message));
    return { ok: false, changed: false, failureKind, message: msg, messages: [], effects: [] };
  }

  function commandMessage(kind, details = {}) { return { kind, ...details }; }
  function commandEffect(kind, details = {}) { return { kind, ...details }; }

  function runUpdateReadmeLink({ args, ports }) {
    try {
      const { documentationPath, urlPath } = resolveInputs({ args, ports });
      const version = ports.npm.currentPackageVersion();
      const link = buildResolverLink({ urlPath, ports });
      const content = ports.filesystem.readPackageFileContent(documentationPath);
      const updatedContent = replaceManagedBlock(content, link);
      ports.filesystem.writePackageFileContent(documentationPath, updatedContent);

      return commandSucceeded({
        changed: true,
        data: { documentationPath, urlPath, version, link, updatedContent },
        messages: commandMessage('package-file-updated-for-version', { documentationPath, version }),
        effects: commandEffect('package-file-updated', { path: documentationPath, version, urlPath, resolverLink: link }),
      });
    } catch (err) {
      return commandFailed(err, { failureKind: 'update-readme-link-command-failed' });
    }
  }

  global.LastOfReadmeLinkUpdater = {
    START_MARKER,
    END_MARKER,
    EXAMPLE_START_MARKER,
    EXAMPLE_END_MARKER,
    encodeBadgeField,
    findManagedPlaceholder,
    replaceManagedBlock,
    buildResolverLink,
    runUpdateReadmeLink,
  };
})(typeof window !== 'undefined' ? window : globalThis);
