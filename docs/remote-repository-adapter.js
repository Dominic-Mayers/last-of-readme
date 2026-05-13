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

  async function resolveTag(tag) {
    const r = await fetch(api(`/commits/${encodeURIComponent(tag)}`));
    if (!r.ok) return null;
    const j = await r.json();
    return j.sha;
  }

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
