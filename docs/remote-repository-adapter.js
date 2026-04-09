function createRemoteRepositoryAPI(remote, urlPath = '') {
  if (!remote || remote.kind !== 'github' || !remote.host || !remote.repository) {
    throw new Error('A GitHub remote with host and repository is required');
  }

  const webBase = `https://${remote.host}`;
  const apiBase =
    remote.host === 'github.com'
      ? 'https://api.github.com'
      : `${webBase}/api/v3`;

  const api = (path) => `${apiBase}/repos/${remote.repository}${path}`;

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
    const baseUrl = `${webBase}/${remote.repository}/tree/${encodeURIComponent(target)}`;
    const normalizedPath = String(urlPath || '').replace(/^\/+/, '');
    return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
  }

  return {
    resolveTag,
    branchesContaining,
    browseDocumentation,
  };
}
