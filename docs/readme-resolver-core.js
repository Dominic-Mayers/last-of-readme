/*
 * Core README resolver logic.
 *
 * This file intentionally does not create a concrete remote repository adapter,
 * read from location.search, mutate the DOM, or redirect the browser. Those
 * responsibilities belong to runtime drivers such as readme-resolver.html, a
 * test harness, or a future browser demo.
 *
 * The resolver core depends only on the remoteRepository port:
 *
 *   {
 *     resolveTag(tag): Promise<string | null>,
 *     branchesContaining(repoNode): Promise<string[]>,
 *     browseDocumentation(target): string
 *   }
 */
(function defineReadmeResolverCore(global) {
  function redirectOutcome(url) {
    return { action: 'redirect', url };
  }

  function renderOutcome(page) {
    return { action: 'render', page };
  }

  async function resolveLineageContract(remoteRepository, version, {
    hasWarning,
    successorPriority,
  }) {
    const base = `v${version}`;
    const last = `${base}-last-of`;
    const next = `${base}-successor-of`;
    const fallbackMessage =
      'No last-of tag was found. The following documentation is not marked as authoritative for this version.';

    function singleLinkOutcome({ label, url }) {
      if (!hasWarning) {
        return redirectOutcome(url);
      }

      return renderOutcome({
        kind: 'fallback',
        message: fallbackMessage,
        links: [{ label, url }],
      });
    }

    async function trySuccessorOf() {
      if (!await remoteRepository.resolveTag(next)) {
        return null;
      }

      return singleLinkOutcome({
        label: next,
        url: remoteRepository.browseDocumentation(next),
      });
    }

    if (await remoteRepository.resolveTag(last)) {
      return redirectOutcome(remoteRepository.browseDocumentation(last));
    }

    if (successorPriority === 'before-branches') {
      const successorOutcome = await trySuccessorOf();
      if (successorOutcome) {
        return successorOutcome;
      }
    }

    const baseRepoNode = await remoteRepository.resolveTag(base);
    if (!baseRepoNode) {
      return renderOutcome({
        kind: 'not-found',
        message: hasWarning
          ? 'No last-of tag was found, and the version tag was not found.'
          : 'version tag not found',
        links: [],
      });
    }

    const containingBranches = await remoteRepository.branchesContaining(baseRepoNode);

    if (successorPriority === 'after-branches' && containingBranches.length <= 1) {
      const successorOutcome = await trySuccessorOf();
      if (successorOutcome) {
        return successorOutcome;
      }
    }

    if (containingBranches.length === 1) {
      return singleLinkOutcome({
        label: containingBranches[0],
        url: remoteRepository.browseDocumentation(containingBranches[0]),
      });
    }

    if (containingBranches.length > 1) {
      return renderOutcome({
        kind: 'ambiguous',
        message: hasWarning
          ? 'No last-of tag was found, and multiple branches contain this version. The following documentation is not marked as authoritative for this version.'
          : 'multiple branches: ' + containingBranches.join(', '),
        links: containingBranches.map((branch) => ({
          label: branch,
          url: remoteRepository.browseDocumentation(branch),
        })),
      });
    }

    return singleLinkOutcome({
      label: base,
      url: remoteRepository.browseDocumentation(base),
    });
  }

  async function resolveUntilNextContract(remoteRepository, version) {
    return resolveLineageContract(remoteRepository, version, {
      successorPriority: 'before-branches',
      hasWarning: false,
    });
  }

  async function resolveUntilNextWarnContract(remoteRepository, version) {
    return resolveLineageContract(remoteRepository, version, {
      successorPriority: 'before-branches',
      hasWarning: true,
    });
  }

  async function resolveUntilBranchWarnContract(remoteRepository, version) {
    return resolveLineageContract(remoteRepository, version, {
      successorPriority: 'after-branches',
      hasWarning: true,
    });
  }

  async function resolveUntilBranchContract(remoteRepository, version) {
    return resolveLineageContract(remoteRepository, version, {
      successorPriority: 'after-branches',
      hasWarning: false,
    });
  }

  async function resolveCorrectionOfContract(remoteRepository, version) {
    const base = `v${version}`;
    const correction = `${base}-correction-of`;

    if (await remoteRepository.resolveTag(correction)) {
      return redirectOutcome(remoteRepository.browseDocumentation(correction));
    }

    if (await remoteRepository.resolveTag(base)) {
      return redirectOutcome(remoteRepository.browseDocumentation(base));
    }

    return renderOutcome({
      kind: 'not-found',
      message: 'No correction-of tag was found, and the version tag was not found.',
      links: [],
    });
  }

  const contractResolvers = {
    'until-next': resolveUntilNextContract,
    'until-next-warn': resolveUntilNextWarnContract,
    'until-branch': resolveUntilBranchContract,
    'until-branch-warn': resolveUntilBranchWarnContract,
    'correction-of': resolveCorrectionOfContract,
  };

  async function resolveReadmeLink({ remoteRepository, version, contract = 'until-next' }) {
    if (!remoteRepository) {
      throw new Error('remoteRepository is required');
    }

    if (!version) {
      return renderOutcome({
        kind: 'not-found',
        message: 'missing params',
        links: [],
      });
    }

    const contractResolver = contractResolvers[contract];
    if (!contractResolver) {
      return renderOutcome({
        kind: 'not-found',
        message: `unsupported documentation contract: ${contract}`,
        links: [],
      });
    }

    return contractResolver(remoteRepository, version);
  }

  global.LastOfReadmeResolver = {
    redirectOutcome,
    renderOutcome,
    resolveLineageContract,
    resolveReadmeLink,
    contractResolvers,
  };
})(typeof window !== 'undefined' ? window : globalThis);
