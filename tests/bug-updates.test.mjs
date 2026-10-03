import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { compactPush, sendBugUpdate } from '../scripts/post-bug-update.mjs';
const endpoint = 'https://example.convex.site/bug/github';
const event = { repository: { full_name: 'owner/repo', private: false }, ref: 'refs/heads/main', after: 'a'.repeat(40), commits: [{ id: 'a'.repeat(40), message: 'Fix save errors\nPRIVATE DETAILS', added: ['private-path'], author: { email: 'private@example.test' } }] };
test('the sender excludes commit bodies, file lists and author email before signing', async () => {
  const compact = compactPush(event);
  assert.ok(!JSON.stringify(compact).includes('PRIVATE')); assert.ok(!JSON.stringify(compact).includes('private-path')); assert.ok(!JSON.stringify(compact).includes('private@example'));
  await sendBugUpdate({ event, endpoint, secret: 'test-key', fetcher: async (url, request) => {
    assert.equal(String(url), endpoint);
    assert.equal(request.headers['x-hub-signature-256'], 'sha256=' + createHmac('sha256', 'test-key').update(request.body).digest('hex'));
    assert.equal(request.redirect, 'error'); return new Response('{}', { status: 200 });
  } });
});
test('temporary failures retry the same payload without duplicate or misleading success', async () => {
  let attempts = 0; const bodies = [];
  await sendBugUpdate({ event, endpoint, secret: 'test-key', pause: async () => {}, fetcher: async (_, request) => { bodies.push(request.body); attempts++; return new Response('', { status: attempts < 3 ? 503 : 200 }); } });
  assert.equal(attempts, 3); assert.equal(new Set(bodies).size, 1);
  attempts = 0;
  await assert.rejects(sendBugUpdate({ event, endpoint, secret: 'test-key', pause: async () => {}, fetcher: async () => { attempts++; return new Response('', { status: 401 }); } }), /rejected/);
  assert.equal(attempts, 1);
});
test('missing configuration and redirects to unrelated services are rejected before transmission', async () => {
  await assert.rejects(sendBugUpdate({ event, endpoint, secret: '' }), /Configure/);
  await assert.rejects(sendBugUpdate({ event, endpoint: 'https://unrelated.test/bug/github', secret: 'test-key' }), /intended Convex/);
});
