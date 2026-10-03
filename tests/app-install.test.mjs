import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../app-install.js', import.meta.url), 'utf8');
function boot({ ua = '', touch = 0, standalone = false, development = false, pathname = '/', register = () => Promise.resolve() } = {}) {
  const events = {}, root = { dataset: {} }, navigation = [], registration = [];
  const display = { matches: standalone, addEventListener: (_, fn) => events.display = fn };
  const window = { matchMedia: () => display, addEventListener: (name, fn) => events[name] = fn, dispatchEvent: () => {} };
  const navigator = { userAgent: ua, maxTouchPoints: touch, standalone, serviceWorker: { register: path => { registration.push(path); return register(); } } };
  const document = { documentElement: root, currentScript: { dataset: { development: String(development) } }, readyState: 'complete', addEventListener: (name, fn) => events[name] = fn };
  runInNewContext(source, { window, navigator, document, location: { pathname, assign: path => navigation.push(path) }, CustomEvent: class {} });
  return { api: window.smInstall, events, root, navigation, registration };
}
function offer(app, { outcome = 'accepted', failure = false } = {}) {
  let calls = 0, prevented = false;
  app.events.beforeinstallprompt({ preventDefault: () => prevented = true, prompt: async () => { calls++; if (failure) throw Error('Blocked'); }, userChoice: Promise.resolve({ outcome }) });
  return { calls: () => calls, prevented: () => prevented };
}
test('the first click opens the browser prompt captured before workspace rendering', async () => {
  const a = boot(), prompt = offer(a); const promise = a.api.request();
  assert.equal(prompt.calls(), 1); assert.equal(a.api.getState().busy, true);
  await a.api.request(); await promise;
  assert.equal(prompt.calls(), 1); assert.equal(prompt.prevented(), true);
  assert.equal(a.api.getState().installed, true); assert.equal(a.root.dataset.appInstalled, 'true');
  assert.equal(a.navigation.length, 0);
});
test('canceling consumes the prompt and a later click goes to install help', async () => {
  const a = boot(), p = offer(a, { outcome: 'dismissed' });
  await a.api.request(); assert.equal(a.api.getState().installed, false);
  assert.match(a.api.getState().message, /canceled/); await a.api.request();
  assert.deepEqual(a.navigation, ['/install']); assert.equal(p.calls(), 1);
  offer(a); await a.api.request(); assert.equal(a.api.getState().installed, true);
});
test('an unavailable or blocked install prompt leads to usable browser instructions', async () => {
  const a = boot(); await a.api.request(); assert.deepEqual(a.navigation, ['/install']);
  const b = boot(); offer(b, { failure: true }); await b.api.request();
  assert.deepEqual(b.navigation, ['/install']); assert.equal(b.api.getState().busy, false);
  const guide = boot({ pathname: '/install' }); offer(guide, { failure: true }); await guide.api.request();
  assert.equal(guide.navigation.length, 0); assert.match(guide.api.getState().message, /browser menu/);
});
test('appinstalled and standalone changes update installation without a persistent fake installed flag', () => {
  const a = boot(); offer(a); a.events.appinstalled();
  assert.equal(a.api.getState().available, false); assert.equal(a.api.getState().installed, true);
  a.events.display({ matches: false }); assert.equal(a.api.getState().installed, false);
  const installed = boot({ standalone: true }); installed.api.request(); assert.equal(installed.navigation.length, 0);
});
test('device instructions recognize Android and iPads using a desktop user agent', () => {
  assert.equal(boot({ ua: 'Android' }).api.getState().platform, 'android');
  assert.equal(boot({ ua: 'iPhone' }).api.getState().platform, 'ios');
  assert.equal(boot({ ua: 'Macintosh', touch: 5 }).api.getState().platform, 'ios');
  assert.equal(boot({ ua: 'Macintosh' }).api.getState().platform, 'desktop');
});
test('ordinary install links work site-wide while modified clicks keep normal link behavior', async () => {
  const a = boot(), p = offer(a); let prevented = false;
  const target = { closest: () => ({}) };
  a.events.click({ target, button: 0, ctrlKey: true, preventDefault: () => prevented = true });
  assert.equal(p.calls(), 0); assert.equal(prevented, false);
  a.events.click({ target, button: 0, preventDefault: () => prevented = true });
  assert.equal(p.calls(), 1); assert.equal(prevented, true);
  await Promise.resolve();
});
test('registration runs on all production entry pages and skips Vite source development', async () => {
  assert.deepEqual(boot({ pathname: '/pathfinder' }).registration, ['/sw.js']);
  assert.deepEqual(boot({ development: true }).registration, []);
  const a = boot({ register: () => Promise.reject(Error('Offline')) });
  await Promise.resolve(); assert.equal(a.api.getState().busy, false);
});
