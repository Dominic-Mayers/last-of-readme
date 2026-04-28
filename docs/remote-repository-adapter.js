function createRemoteRepositoryAPI(remote, urlPath = '') {
  if (!remote || remote.kind !== 'github') {
    throw new Error('A GitHub remote is required');
  }

  const resolvedRemote = remote.repositoryApiUrl && remote.repositoryBrowserUrl
    ? remote
    : legacyGitHubRemoteToUrls(remote);

  if (!resolvedRemote.repositoryApiUrl || !resolvedRemote.repositoryBrowserUrl) {
    throw new Error(
      'A GitHub remote with repositoryApiUrl and repositoryBrowserUrl is required'
    );
  }

  const repositoryApiUrl = String(resolvedRemote.repositoryApiUrl).replace(/\/+$/, '');
  const repositoryBrowserUrl = String(resolvedRemote.repositoryBrowserUrl).replace(/\/+$/, '');

  const api = (path) => `${repositoryApiUrl}${path}`;

  async function resolveTag(tag) {
    const r = await fetch(api(`/commits/${encodeURIComponent(tag)}`));
    if (!r.ok) return null;
    const j = await r.json();
    return j.sha;
  }

  async function branchesContaining(repoNode) {
    const r = await fetch(api(`/branches`));
    if (!r.ok) return [];

    const branches = await r.json();
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


function legacyGitHubRemoteToUrls(remote) {
  if (!remote || !remote.host || !remote.repository) {
    return remote;
  }

  const host = String(remote.host).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const repository = String(remote.repository).replace(/^\/+/, '').replace(/\/+$/, '');
  const apiBase = host === 'github.com'
    ? 'https://api.github.com'
    : `https://${host}/api/v3`;

  return {
    kind: 'github',
    repositoryApiUrl: `${apiBase}/repos/${repository}`,
    repositoryBrowserUrl: `https://${host}/${repository}`,
  };
}
