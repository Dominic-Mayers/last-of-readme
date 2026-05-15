/**
 * Creates the remote-repository adapter used by readme-resolver.html.
 *
 * The returned API is the resolver's boundary to the remote repository:
 * resolveLineageContract() and resolveCorrectionOfContract() use resolveTag()
 * to detect documentation tags, resolveLineageContract() uses
 * branchesContaining() to expose branch alternatives, and all contract
 * resolvers use browseDocumentation() to build the final documentation URL.
 *
 * @param {object} remote
 * @param {string} remote.kind - Remote adapter kind. Currently only `github`
 * is supported.
 * @param {string} remote.repositoryApiUrl - GitHub repository API endpoint used
 * for tag, branch, and comparison queries.
 * @param {string} remote.repositoryBrowserUrl - Browser URL for the repository.
 * @param {string} [urlPath=''] - Repository-relative documentation path to open
 * inside the resolved tag or branch.
 * @returns {{ resolveTag: Function, branchesContaining: Function, browseDocumentation: Function }}
 * Remote repository API consumed by readme-resolver.html.
 */
function createRemoteRepositoryAPI(remote, urlPath = '') {
  if (!remote || remote.kind !== 'github') {
    throw new Error('A GitHub remote is required');
  }

  if (!remote.repositoryApiUrl || !remote.repositoryBrowserUrl) {
    throw new Error(
      'A GitHub remote with repositoryApiUrl and repositoryBrowserUrl is required'
    );
  }

  const repositoryApiUrl = String(remote.repositoryApiUrl).replace(/\/+$/, '');
  const repositoryBrowserUrl = String(remote.repositoryBrowserUrl).replace(/\/+$/, '');

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

  /**
   * Builds the browser URL for documentation at a resolved tag or branch.
   *
   * Used by all readme-resolver.html contract resolvers when they redirect or
   * render documentation alternatives.
   *
   * @param {string} target - Resolved documentation tag or branch name.
   * @returns {string} Browser URL for the selected documentation target.
   */
  function browseDocumentation(target) {
    const baseUrl = `${repositoryBrowserUrl}/tree/${encodeURIComponent(target)}`;
    const normalizedPath = String(urlPath || '').replace(/^\/+/, '');
    return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
  }

  return {
    resolveTag,
    branchesContaining,
    browseDocumentation,
  };
}
