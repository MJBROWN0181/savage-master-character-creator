import { convexTest } from 'convex-test';
import { test, expect, vi, afterEach } from 'vitest';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
import { bugPushUpdate, cleanCommit } from './bugUpdates';
const modules = import.meta.glob('./**/*.ts');
const repo = 'MJBROWN0181/savage-master-character-creator';
const sha = 'a'.repeat(40);
const payload = { repository: { full_name: repo }, ref: 'refs/heads/main', after: sha, deleted: false, commits: [{ message: 'fix(auth): keep email codes intact\nPRIVATE BODY' }, { message: 'Add Bug’s setup guidance' }] };
afterEach(() => vi.unstubAllEnvs());
async function signature(body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('test-hook-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return 'sha256=' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function deliver(t: any, data: any, headers: any = {}) {
  const body = JSON.stringify(data);
  return t.fetch('/bug/github', { method: 'POST', headers: { 'x-github-event': 'push', 'x-hub-signature-256': await signature(body), ...headers }, body });
}
function fixture() {
  vi.stubEnv('BUG_GITHUB_WEBHOOK_SECRET', 'test-hook-secret'); vi.stubEnv('BUG_GITHUB_REPOSITORY', repo);
  return convexTest(schema, modules);
}
test('Bug speaks in first person about code work without claiming a live release or exposing commit bodies', () => {
  const update = bugPushUpdate(payload, repo)!;
  expect(update.body).toContain('I untangled a bug: keep email codes intact');
  expect(update.body).toContain('I added Bug’s setup guidance');
  expect(update.body).toContain('haven’t confirmed a live release');
  expect(update.body).not.toContain('PRIVATE BODY');
  expect(cleanCommit('Fix token=private-secret Bearer protected person@test.example https://example.test/?key=secret')).not.toMatch(/private-secret|protected|person@test|key=secret/);
  expect(cleanCommit('Fix ghp_PRIVATE123 github_pat_SUPERSECRET')).not.toMatch(/PRIVATE123|SUPERSECRET/);
});
test('bounded summaries include all commit counts and ignore tags, deleted branches and empty pushes', () => {
  const large = bugPushUpdate({ ...payload, commits: Array.from({ length: 100 }, (_, i) => ({ message: `feat: improvement ${i} ${'x'.repeat(200)}` })), totalCommits: 300 }, repo)!;
  expect(large.body.length).toBeLessThanOrEqual(2000); expect(large.body).toContain('300 commits');
  expect(bugPushUpdate({ ...payload, deleted: true }, repo)).toBeNull();
  expect(bugPushUpdate({ ...payload, ref: 'refs/tags/v1' }, repo)).toBeNull();
  expect(bugPushUpdate({ ...payload, commits: [] }, repo)).toBeNull();
});
test('signed pushes create one official post, replays are deduplicated and different branches get their own notes', async () => {
  const t = fixture();
  const first = await deliver(t, payload); expect(first.status).toBe(200);
  expect((await deliver(t, payload)).status).toBe(200);
  expect((await deliver(t, { ...payload, commits: [{ message: 'fix: alternate wording for the same commit' }] })).status).toBe(200);
  let feed: any = await t.query(ref<'query'>('chronicles:feed'), { authorHandle: 'bug' });
  expect(feed.posts).toHaveLength(1); expect(feed.posts[0].author.official).toBe('bug');
  expect(feed.posts[0].body).toContain('I untangled');
  expect((await deliver(t, { ...payload, ref: 'refs/heads/preview' })).status).toBe(200);
  feed = await t.query(ref<'query'>('chronicles:feed'), { authorHandle: 'bug' }); expect(feed.posts).toHaveLength(2);
});
test('unsigned or tampered requests and wrong repositories cannot publish; ignored events stay quiet', async () => {
  const t = fixture();
  expect((await deliver(t, payload, { 'x-hub-signature-256': 'sha256=' + '0'.repeat(64) })).status).toBe(401);
  expect((await deliver(t, payload, { 'x-hub-signature-256': '' })).status).toBe(401);
  expect((await deliver(t, { ...payload, repository: { full_name: 'stranger/repo' } })).status).toBe(400);
  expect((await deliver(t, { ...payload, after: 'not-a-commit' })).status).toBe(400);
  expect((await deliver(t, payload, { 'x-github-event': 'ping' })).status).toBe(200);
  expect((await deliver(t, payload, { 'x-github-event': 'pull_request' })).status).toBe(202);
  expect((await deliver(t, { ...payload, deleted: true })).status).toBe(202);
  expect((await t.run((ctx: any) => ctx.db.query('chroniclePosts').collect()))).toHaveLength(0);
});
test('unconfigured endpoints and oversized bodies fail closed', async () => {
  const t = fixture();
  expect((await t.fetch('/bug/github', { method: 'POST', body: 'x'.repeat(1000001) })).status).toBe(413);
  vi.stubEnv('BUG_GITHUB_WEBHOOK_SECRET', '');
  expect((await deliver(t, payload)).status).toBe(503);
});
