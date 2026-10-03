import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../bug-capture.js', import.meta.url), 'utf8');
function setup() {
  const events = {}, signals = [], window = { innerWidth: 400, innerHeight: 800, addEventListener(name, fn) { events[name] = fn; }, dispatchEvent(event) { signals.push(event); } };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail ?? null; } }
  runInNewContext(source, { window, location: { pathname: '/profile', search: '?token=SECRET' }, navigator: { userAgent: 'Test browser', onLine: false }, console: { error() {} }, URL, Error, CustomEvent });
  return { capture: window.smBugCapture, events, signals };
}
test('diagnostics capture runtime errors without URL secrets, emails, or bearer credentials', () => {
  const { capture, events } = setup();
  events.error({ target: null, message: 'ignored element' });
  capture.record('Application error', new Error('Failed https://example.test/api?token=TOPSECRET#private password=SECRET person@example.com Bearer PRIVATE'));
  const snapshot = capture.snapshot(), text = JSON.stringify(snapshot);
  assert.equal(snapshot.page, '/profile'); assert.equal(snapshot.online, false);
  assert.equal(snapshot.errors.length, 1);
  for (const secret of ['TOPSECRET', 'SECRET', 'person@example.com', 'PRIVATE', '#private']) assert.ok(!text.includes(secret));
  assert.ok(text.includes('https://example.test/api'));
  assert.ok(!capture.clean('{"password": "PRIVATE", "token": "TOPSECRET"}').includes('PRIVATE'));
  assert.ok(!capture.clean('{"token": "TOPSECRET"}').includes('TOPSECRET'));
});
test('errors are deduplicated, bounded, and returned as copies', () => {
  const { capture } = setup();
  for (let index = 0; index < 15; index++) capture.record('error', 'error ' + index);
  capture.record('error', 'error 14');
  const snapshot = capture.snapshot(); assert.equal(snapshot.errors.length, 10);
  snapshot.errors[0].message = 'changed';
  assert.equal(capture.snapshot().errors[0].message, 'error 5');
});
test('unhandled rejection objects are omitted rather than serializing private state', () => {
  const { capture, events } = setup();
  events.unhandledrejection({ reason: { password: 'private', character: { notes: 'private campaign' } } });
  assert.equal(capture.snapshot().errors[0].message, 'A background request failed.');
});
test('the companion receives an error signal without captured diagnostics or private contents', () => {
  const { capture, signals } = setup();
  capture.record('Save failed', 'private error text');
  capture.record('Save failed', 'private error text');
  assert.equal(signals.length, 1); assert.equal(signals[0].type, 'sm:bug-error');
  assert.equal(signals[0].detail, null); assert.ok(!JSON.stringify(signals).includes('private error text'));
});
