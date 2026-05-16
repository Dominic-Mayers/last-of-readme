/**
 * Creates the remote-repository service adapter used by readme-resolver-driver.html.
 *
 * The returned API is the resolver's boundary to repository state:
 * readme-resolver-core.js uses resolveTag()
 * to detect documentation tags, the lineage resolver uses
 * branchesContaining() to expose branch alternatives.
 *
 * Browser/documentation presentation is handled separately by the repository
 * page adapter created with createRepositoryPageAPI().
 *
 * @param {object} remote
 * @param {string} remote.kind - Remote adapter kind. Currently only `github`
 * is supported.
 * @param {string} remote.repositoryApiUrl - GitHub repository API endpoint used
 * for tag, branch, and comparison queries.
 * @returns {{ resolveTag: Function, branchesContaining: Function }}
 * Remote repository service port consumed by readme-resolver-core.js.
 */
function createRemoteRepositoryAPI(remote) {
  if (!remote || remote.kind !== 'github') {
    throw new Error('A GitHub remote is required');
  }

  if (!remote.repositoryApiUrl) {
    throw new Error('A GitHub remote with repositoryApiUrl is required');
  }

  const repositoryApiUrl = String(remote.repositoryApiUrl).replace(/\/+$/, '');

  const api = (path) => `${repositoryApiUrl}${path}`;

  /**
   * Resolve a Git tag or branch-like target to a repository node SHA.
   *
   * Used by resolveLineageContract() and resolveCorrectionOfContract() to test
   * whether version, last-of, successor-of, and correction-of tags exist.
   *
   * @param {string} tag - Tag or ref name to resolve through the GitHub commits API.
   * @returns {Promise<string | null>} Commit SHA when the target exists; otherwise null.
   */
  async function resolveTag(tag) {
    const r = await fetch(api(`/commits/${encodeURIComponent(tag)}`));
    if (!r.ok) return null;
    const j = await r.json();
    return j.sha;
  }

  /**
   * Finds repository branches that contain the resolved version node.
   *
   * Used by resolveLineageContract() when no last-of tag selects an
   * authoritative documentation target.
   *
   * @param {string} repoNode - Commit SHA resolved from the version tag.
   * @returns {Promise<string[]>} Branch names that contain the commit.
   */
  async function branchesContaining(repoNode) {
    const branches = [];
    let url = api(`/branches?per_page=100`);
    while (url) {
      const r = await fetch(url);
      if (!r.ok) return [];
      branches.push(...await r.json());
      const link = r.headers.get('Link') || '';
      const match = link.match(/<([^>]+)>;\s*rel="next"/);
      url = match ? match[1] : null;
    }

    const result = [];

    for (const b of branches) {
      const cmp = await fetch(
        api(`/compare/${encodeURIComponent(repoNode)}...${encodeURIComponent(b.name)}`)
      );
      if (!cmp.ok) continue;

      const j = await cmp.json();
      if (j.status === 'ahead' || j.status === 'identical') {
        result.push(b.name);
      }
    }

    return result;
  }

  return {
    resolveTag,
    branchesContaining,
  };
}

/**
 * Creates the repository page adapter used by readme-resolver-driver.html.
 *
 * This adapter is the resolver's boundary to the repository browser/page. The
 * production implementation builds GitHub browser URLs. Other environments,
 * such as a demo, can provide an adapter that maps documentation targets to
 * local display instructions instead.
 *
 * @param {object} remote
 * @param {string} remote.kind - Repository page kind. Currently only `github`
 * is supported.
 * @param {string} remote.repositoryBrowserUrl - Browser URL for the repository.
 * @param {string} [urlPath=''] - Repository-relative documentation path to open
 * inside the resolved tag or branch.
 * @returns {{ browseDocumentation: Function }}
 * Repository page port consumed by readme-resolver-core.js.
 */
function createRepositoryPageAPI(remote, urlPath = '') {
  if (!remote || remote.kind !== 'github') {
    throw new Error('A GitHub repository page is required');
  }

  if (!remote.repositoryBrowserUrl) {
    throw new Error('A GitHub repository page with repositoryBrowserUrl is required');
  }

  const repositoryBrowserUrl = String(remote.repositoryBrowserUrl).replace(/\/+$/, '');

  /**
   * Builds the browser destination for documentation at a resolved tag or branch.
   *
   * @param {string} target - Resolved documentation tag or branch name.
   * @returns {string} Browser URL for the selected documentation target.
   */
  function browseDocumentation(target) {
    const baseUrl = `${repositoryBrowserUrl}/tree/${encodeURIComponent(target)}`;
    const normalizedPath = String(urlPath || '').replace(/^\/+/, '');
    return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
  }

  return { browseDocumentation };
}
