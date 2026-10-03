import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function compactPush(event) {
  const commits = Array.isArray(event.commits) ? event.commits : [];
  const commit = value => value ? { id: value.id, message: String(value.message || '').split(/\r?\n/)[0].slice(0, 500), timestamp: value.timestamp } : null;
  return { repository: { full_name: event.repository?.full_name }, ref: event.ref, after: event.after, deleted: event.deleted,
    commits: commits.slice(0, 100).map(commit), totalCommits: commits.length, head_commit: commit(event.head_commit) };
}
export async function sendBugUpdate({ event, endpoint, secret, fetcher = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (!endpoint || !secret) throw new Error('Configure BUG_CHRONICLES_ENDPOINT and BUG_GITHUB_WEBHOOK_SECRET before enabling Bug’s updates.');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.convex.site') || url.pathname !== '/bug/github') throw new Error('Bug’s endpoint must be the intended Convex HTTPS /bug/github route.');
  const body = JSON.stringify(compactPush(event));
  const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  for (let attempt = 0; attempt < 6; attempt++) {
    let response;
    try { response = await fetcher(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-github-event': 'push', 'x-hub-signature-256': signature }, body, signal: AbortSignal.timeout(20000), redirect: 'error' }); }
    catch { if (attempt === 5) throw new Error('Bug’s update endpoint could not be reached. Rerun this job after restoring the connection.'); }
    if (response?.ok) return { status: response.status };
    if (response && ![404, 408, 429].includes(response.status) && response.status < 500) throw new Error(`Bug rejected the update (HTTP ${response.status}). Check the endpoint configuration.`);
    if (attempt < 5) await pause(Math.min(10000 * 2 ** attempt, 60000));
  }
  throw new Error('Bug’s update was not recorded. Rerun this job after the endpoint is ready.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.env.GITHUB_EVENT_NAME !== 'push') throw new Error('Bug only accepts GitHub push events.');
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const result = await sendBugUpdate({ event, endpoint: process.env.BUG_CHRONICLES_ENDPOINT, secret: process.env.BUG_GITHUB_WEBHOOK_SECRET });
    console.log(result.status === 202 ? 'No code change needs a Bug post.' : 'Bug’s workshop update is recorded.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
