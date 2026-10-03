import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { bugPushUpdate, validBugSignature } from './bugUpdates';

export const receive = httpAction(async (ctx, request) => {
  const secret = process.env.BUG_GITHUB_WEBHOOK_SECRET;
  const repository = process.env.BUG_GITHUB_REPOSITORY;
  if (!secret || !repository) return new Response('Bug’s GitHub updates are not configured.', { status: 503 });
  // Bound reads before parsing. File lists, diffs and account details are never stored.
  const reader = request.body?.getReader();
  if (!reader) return new Response('Missing payload.', { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 1000000) { await reader.cancel(); return new Response('Payload too large.', { status: 413 }); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const raw = new TextDecoder().decode(bytes);
  if (!await validBugSignature(raw, request.headers.get('x-hub-signature-256'), secret)) return new Response('Invalid signature.', { status: 401 });
  if (request.headers.get('x-github-event') === 'ping') return new Response('Bug is listening.');
  if (request.headers.get('x-github-event') !== 'push') return new Response('Event ignored.', { status: 202 });
  let payload, update;
  try { payload = JSON.parse(raw); update = bugPushUpdate(payload, repository); }
  catch { return new Response('Invalid push payload.', { status: 400 }); }
  if (!update) return new Response('No code update to publish.', { status: 202 });
  // A signature binds content, not delivery headers. Deduplicate by signed branch+SHA.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${repository.toLowerCase()}\n${payload.ref}\n${payload.after}`));
  const key = 'github-' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  try {
    const id = await ctx.runMutation(internal.bug.publishInternal, { ...update, publicationKey: key });
    return Response.json({ published: true, postId: id });
  } catch {
    return new Response('Bug could not record this update. Retry this delivery.', { status: 503 });
  }
});
