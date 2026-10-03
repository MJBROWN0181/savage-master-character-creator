import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
function boot({ offline = false } = {}) {
  const listeners = {}, cached = new Map(), puts = [], deleted = [], precached = [];
  const cache = { addAll: async paths => precached.push(...paths), put: async (path, response) => { puts.push(path); cached.set(path, response); } };
  const scope = { location: { origin: 'https://smsheets.com' }, addEventListener: (name, fn) => listeners[name] = fn, skipWaiting: () => {}, clients: { claim: () => {} } };
  runInNewContext(source, { self: scope, URL, Response, caches: { open: async () => cache, match: async path => cached.get(path), keys: async () => ['other-app', 'savage-master-old', 'savage-master-v2'], delete: async key => deleted.push(key) }, fetch: async () => { if (offline) throw Error('Offline'); return new Response('public shell'); } });
  async function request(path, method = 'GET') {
    let response, handled = false; const work = [];
    listeners.fetch({ request: { url: path.startsWith('http') ? path : 'https://smsheets.com' + path, method }, respondWith: value => { handled = true; response = value; }, waitUntil: value => work.push(value) });
    const result = await response; await Promise.all(work); return { handled, response: result };
  }
  return { listeners, cached, puts, deleted, precached, request };
}
test('offline clean routes and query-bearing game URLs use the correct cached workspace', async () => {
  const a = boot({ offline: true });
  for (const [path, shell] of [['/?game=savage&create=1', '/index.html'], ['/dnd?create=1', '/dnd.html'], ['/pathfinder.html?create=1', '/pathfinder.html'], ['/install/', '/install.html']]) {
    a.cached.set(shell, new Response(shell)); const r = await a.request(path);
    assert.equal(r.handled, true); assert.equal(await r.response.text(), shell);
  }
});
test('API calls, private shared posts, cross-origin requests, and mutations bypass offline caching', async () => {
  const a = boot();
  for (const [path, method] of [['/api/share?post=private', 'GET'], ['/p/private', 'GET'], ['/api/post-card?post=private', 'GET'], ['https://example.com/assets/data.js', 'GET'], ['/dnd', 'POST']]) assert.equal((await a.request(path, method)).handled, false);
  assert.equal(a.puts.length, 0);
});
test('app shells and card artwork cache under stable paths while missing offline assets fail honestly', async () => {
  const a = boot(); await a.request('/dnd?create=1'); await a.request('/images/art/cards/hero.webp?v=1');
  assert.deepEqual(a.puts, ['/dnd.html', '/images/art/cards/hero.webp']);
  const offline = boot({ offline: true }); const missing = await offline.request('/assets/not-downloaded.js');
  assert.equal(missing.response.type, 'error');
});
test('activation cleans only this app’s old cache and precache requests are unique', async () => {
  const a = boot(); let wait;
  a.listeners.activate({ waitUntil: value => wait = value }); await wait;
  assert.deepEqual(a.deleted, ['savage-master-old']);
  a.listeners.install({ waitUntil: value => wait = value }); await wait;
  assert.equal(a.precached.length, new Set(a.precached).size);
});
