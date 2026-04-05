export function createRemoteRepositoryAPI(repository) {
  const api = (path) => `https://api.github.com/repos/${repository}${path}`;
  const gh = (ref) => `https://github.com/${repository}/tree/${ref}`;

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
      if (j.status === "ahead" || j.status === "identical") {
        result.push(b.name);
      }
    }

    return result;
  }

  function browseDocumentation(target) {
    return gh(target);
  }

  return {
    resolveTag,
    branchesContaining,
    browseDocumentation,
  };
}
