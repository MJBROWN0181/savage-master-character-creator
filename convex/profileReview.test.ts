import { convexTest } from 'convex-test';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
const modules = import.meta.glob('./**/*.ts');
const mail = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({ Resend: class { emails = { send: mail }; } }));
const draft = { handle: 'new-player', displayName: 'New player', bio: 'Hello', games: [], memory: '', roles: [], links: [], favorites: [], highlights: [], appearance: { background: 'midnight', accent: 'gold', font: 'classic', layout: 'balanced', sections: ['about', 'games', 'memory', 'characters', 'journal'] }, ageConfirmed: true, communityAccepted: true };
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('PROFILE_REVIEWER_EMAILS', 'reviewer@example.test');
  vi.stubEnv('SUPPORT_RESEND_KEY', 'test-key');
  vi.stubEnv('SUPPORT_EMAIL_FROM', 'Support <support@smsheets.com>');
  vi.stubEnv('SUPPORT_EMAIL_TO', 'support@smsheets.com');
  vi.stubEnv('PROFILE_REVIEW_EMAIL_TO', '');
  vi.stubEnv('SITE_URL', 'https://smsheets.com');
  mail.mockReset(); mail.mockResolvedValue({ data: { id: 'receipt' }, error: null });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => ({
    player: await ctx.db.insert('users', { email: 'player@example.test', emailVerificationTime: Date.now() }),
    reviewer: await ctx.db.insert('users', { email: 'reviewer@example.test', emailVerificationTime: Date.now() }),
    unverified: await ctx.db.insert('users', { email: 'reviewer@example.test' }),
  }));
  return { t, ids, player: t.withIdentity({ subject: ids.player }), reviewer: t.withIdentity({ subject: ids.reviewer }), unverified: t.withIdentity({ subject: ids.unverified }) };
}
const save = ref<'mutation'>('profiles:save'), mine = ref<'query'>('profiles:mine');
const queue = ref<'query'>('profiles:pendingReviews'), decide = ref<'mutation'>('profiles:decideReview');
function decision(p: any, approve = true, note = '') {
  return { profileId: p._id, expectedUpdatedAt: p.updatedAt, expectedRequestedAt: p.reviewRequestedAt, approve, note };
}
test('completed new profiles automatically queue once and email support without exposing private drafts', async () => {
  const { t, player, reviewer } = await fixture();
  await expect(player.mutation(save, { ...draft, communityAccepted: false })).rejects.toThrow('community rules');
  const id = await player.mutation(save, draft);
  await player.mutation(ref<'mutation'>('profiles:requestReview'), {});
  expect(await player.mutation(save, { ...draft, bio: 'Changed while pending' })).toBe(id);
  const p: any = await player.query(mine, {});
  expect(p.reviewStatus).toBe('pending');
  expect(await t.query(ref<'query'>('profiles:publicProfile'), { handle: draft.handle })).toBeNull();
  const rows: any = await reviewer.query(queue, {});
  expect(rows).toHaveLength(1); expect(rows[0].bio).toBe('Changed while pending');
  expect(rows[0].ownerId).toBeUndefined();
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(mail).toHaveBeenCalledTimes(1);
  expect(mail.mock.calls[0][0]).toMatchObject({ to: ['support@smsheets.com'], subject: '[Savage Master Profile review] @new-player' });
  expect(mail.mock.calls[0][0].text).toContain('https://smsheets.com/profile?reviews=1');
  expect(mail.mock.calls[0][0].text).not.toContain('Changed while pending');
  expect((await player.query(mine, {}) as any).reviewNotification).toBe('sent');
});
test('review access requires a verified database email and does not trust forged identity claims', async () => {
  const { t, ids, player, unverified, reviewer } = await fixture();
  await player.mutation(save, draft);
  const p: any = await player.query(mine, {});
  const forged = t.withIdentity({ subject: ids.player, email: 'reviewer@example.test', emailVerified: true });
  for (const caller of [t, player, unverified, forged]) {
    expect(await caller.query(ref<'query'>('profiles:canReview'), {})).toBe(false);
    await expect(caller.query(queue, {})).rejects.toThrow('verified profile reviewers');
    await expect(caller.mutation(decide, decision(p))).rejects.toThrow('verified profile reviewers');
  }
  expect(await reviewer.query(ref<'query'>('profiles:canReview'), {})).toBe(true);
  vi.stubEnv('PROFILE_REVIEWER_EMAILS', 'player@example.test');
  await expect(player.mutation(decide, decision(p))).rejects.toThrow('own profile');
  await t.finishAllScheduledFunctions(vi.runAllTimers);
});
test('approval unlocks Chronicles and only publishes the exact reviewed revision', async () => {
  const { t, player, reviewer } = await fixture();
  await player.mutation(save, draft);
  const p: any = await player.query(mine, {});
  const post = { title: 'Our adventure', body: 'A tale', game: 'Any tabletop game', kind: 'Session tale', consent: true };
  await expect(player.mutation(ref<'mutation'>('chronicles:publish'), post)).rejects.toThrow('review');
  await player.mutation(save, { ...draft, bio: 'Current draft' });
  await expect(reviewer.mutation(decide, decision(p))).rejects.toThrow('Profile changed');
  const current: any = await player.query(mine, {});
  await reviewer.mutation(decide, decision(current));
  expect(await reviewer.query(queue, {})).toEqual([]);
  const publicData: any = await t.query(ref<'query'>('profiles:publicProfile'), { handle: draft.handle });
  expect(publicData.bio).toBe('Current draft');
  expect(publicData.reviewRequestedAt).toBeUndefined(); expect(publicData.reviewNote).toBeUndefined();
  await player.mutation(ref<'mutation'>('chronicles:publish'), post);
  await player.mutation(save, { ...draft, bio: 'Unreviewed later edit' });
  expect((await t.query(ref<'query'>('profiles:publicProfile'), { handle: draft.handle }) as any).bio).toBe('Current draft');
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(mail).not.toHaveBeenCalled(); // No obsolete notification after approval.
});
test('change requests reach the owner; withdrawing and resubmitting invalidate old decisions', async () => {
  const { t, player, reviewer } = await fixture();
  await player.mutation(save, draft);
  let p: any = await player.query(mine, {});
  await expect(reviewer.mutation(decide, decision(p, false))).rejects.toThrow('Explain');
  await reviewer.mutation(decide, decision(p, false, 'Please remove the exposed phone number.'));
  expect((await player.query(mine, {}) as any).reviewNote).toBe('Please remove the exposed phone number.');
  vi.advanceTimersByTime(61000);
  await player.mutation(ref<'mutation'>('profiles:requestReview'), {});
  p = await player.query(mine, {});
  await player.mutation(ref<'mutation'>('profiles:unpublish'), {});
  await expect(player.mutation(ref<'mutation'>('profiles:requestReview'), {})).rejects.toThrow('wait a minute');
  vi.advanceTimersByTime(61000);
  await player.mutation(ref<'mutation'>('profiles:requestReview'), {});
  await expect(reviewer.mutation(decide, decision(p))).rejects.toThrow('Profile changed');
  expect((await player.query(mine, {}) as any).reviewNote).toBeUndefined();
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(mail).toHaveBeenCalledTimes(1); // Old submissions are superseded.
});
test('email failure retries safely and the profile stays in the queue', async () => {
  const { t, player, reviewer } = await fixture();
  mail.mockResolvedValue({ error: { message: 'Unavailable' } });
  await player.mutation(save, draft);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(mail).toHaveBeenCalledTimes(3);
  expect(new Set(mail.mock.calls.map(call => call[1].idempotencyKey)).size).toBe(1);
  expect((await player.query(mine, {}) as any)).toMatchObject({ reviewStatus: 'pending', reviewNotification: 'failed' });
  expect(await reviewer.query(queue, {})).toHaveLength(1);
});
test('development review notifications link to the development site', async () => {
  const { t, player } = await fixture();
  vi.stubEnv('SITE_URL', 'http://localhost:5173');
  await player.mutation(save, draft);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(mail.mock.calls[0][0].text).toContain('http://localhost:5173/profile?reviews=1');
});
test('private existing drafts stay private and missing email configuration does not lose the review', async () => {
  const { t, player, reviewer } = await fixture();
  const id: any = await player.mutation(save, draft);
  await player.mutation(ref<'mutation'>('profiles:unpublish'), {});
  await player.mutation(save, { ...draft, bio: 'Private edit' });
  expect((await player.query(mine, {}) as any).reviewStatus).toBe('private');
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(mail).not.toHaveBeenCalled();
  vi.advanceTimersByTime(61000); vi.stubEnv('SUPPORT_EMAIL_TO', '');
  await player.mutation(ref<'mutation'>('profiles:requestReview'), {});
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(await t.run(ctx => ctx.db.get(id))).toMatchObject({ reviewStatus: 'pending', reviewNotification: 'unconfigured' });
  expect(await reviewer.query(queue, {})).toHaveLength(1);
});
