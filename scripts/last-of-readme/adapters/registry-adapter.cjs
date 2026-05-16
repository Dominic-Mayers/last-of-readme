#!/usr/bin/env node

const START_MARKER = '<!-- DOC-LINK-START -->';
const END_MARKER = '<!-- DOC-LINK-END -->';

async function fetchPublishedLink(packageName) {
  let data;
  try {
    const r = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!r.ok) {
      throw new Error(`Registry responded with ${r.status}`);
    }
    data = await r.json();
  } catch (err) {
    throw new Error(`Failed to fetch published package info: ${err.message}`);
  }

  const readme = data.readme || '';
  const si = readme.indexOf(START_MARKER);
  if (si === -1) return null;
  const ei = readme.indexOf(END_MARKER, si + START_MARKER.length);
  if (ei === -1) return null;
  const block = readme.slice(si + START_MARKER.length, ei).trim();
  if (!block) return null;

  const hrefMatch = block.match(/href="([^"]+)"/);
  if (!hrefMatch) return null;

  let url;
  try {
    url = new URL(hrefMatch[1]);
  } catch {
    return null;
  }

  const version = url.searchParams.get('v');
  const contract = url.searchParams.get('contract');
  return version && contract ? { version, contract } : null;
}

module.exports = { fetchPublishedLink };
