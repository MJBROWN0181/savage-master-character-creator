import { convexTest } from 'convex-test';
import { test, expect, vi, afterEach } from 'vitest';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
const modules = import.meta.glob('./**/*.ts');
const draft = { handle: 'player', displayName: 'Player', bio: 'Hello', games: [], memory: '', roles: [], links: [], favorites: [], highlights: [], appearance: { background: 'midnight', accent: 'gold', font: 'classic', layout: 'balanced', sections: ['about', 'games', 'memory', 'characters', 'journal'] }, ageConfirmed: true };
afterEach(() => vi.unstubAllEnvs());
async function fixture() {
  const t = convexTest(schema, modules);
  await t.mutation(ref<'mutation'>('bug:ensureProfile'), {});
  const ids = await t.run(async ctx => {
    const player = await ctx.db.insert('users', { email: 'player@test.example' });
    const editor = await ctx.db.insert('users', { email: 'editor@test.example', emailVerificationTime: Date.now() });
    const unverified = await ctx.db.insert('users', { email: 'editor@test.example' });
    return { player, editor, unverified };
  });
  const player = t.withIdentity({ subject: ids.player });
  const profileId: any = await player.mutation(ref<'mutation'>('profiles:save'), draft);
  await t.run(ctx => ctx.db.patch(profileId, { reviewStatus: 'approved', publicSnapshot: { ...draft } }));
  const feed: any = await t.query(ref<'query'>('chronicles:feed'), { authorHandle: 'bug' });
  return { t, ids, player, originalId: feed.posts[0]._id, editor: t.withIdentity({ subject: ids.editor }), unverified: t.withIdentity({ subject: ids.unverified }) };
}
test('Bug is seeded once with no login identity and only reviewed public data', async () => {
  const { t } = await fixture();
  await t.mutation(ref<'mutation'>('bug:ensureProfile'), {});
  const state = await t.run(async ctx => {
    const p = await ctx.db.query('profiles').withIndex('by_handle', q => q.eq('handle', 'bug')).unique();
    return { user: await ctx.db.get(p!.ownerId), accounts: await ctx.db.query('authAccounts').collect(), posts: await ctx.db.query('chroniclePosts').collect() };
  });
  expect(state.user?.email).toBeUndefined(); expect(state.accounts).toHaveLength(0); expect(state.posts).toHaveLength(1);
  const profile: any = await t.query(ref<'query'>('profiles:publicProfile'), { handle: 'bug' });
  expect(profile).toMatchObject({ official: 'bug', avatarUrl: '/images/art/the-bug.png' });
  const feed: any = await t.query(ref<'query'>('chronicles:feed'), { authorHandle: 'bug' });
  expect(feed.posts[0].author.official).toBe('bug');
  expect(feed.posts[0].publicationKey).toBeUndefined(); expect(feed.posts[0].publishedBy).toBeUndefined();
});
test('players cannot reserve Bug’s address, spoof official posts, or publish as Bug', async () => {
  const { t, player } = await fixture();
  await expect(player.mutation(ref<'mutation'>('profiles:save'), { ...draft, handle: ' BUG ' })).rejects.toThrow('official site companion');
  await expect(t.mutation(ref<'mutation'>('bug:publishUpdate'), { title: 'Fake', body: 'Fake release', requestId: 'abcdefgh' })).rejects.toThrow('verified site editors');
  await expect(player.mutation(ref<'mutation'>('bug:publishUpdate'), { title: 'Fake', body: 'Fake release', requestId: 'abcdefgh' })).rejects.toThrow('verified site editors');
  await expect(player.mutation(ref<'mutation'>('chronicles:publish'), { title: 'Fake', body: 'Fake release', game: 'Any tabletop game', kind: 'Official update', consent: true })).rejects.toThrow('category');
});
test('official publishing requires a verified allowlisted database identity and is retry safe', async () => {
  const { t, editor, unverified, player, ids } = await fixture();
  vi.stubEnv('BUG_EDITOR_EMAILS', 'EDITOR@test.example');
  const update = { title: 'Setup tips', body: 'Use Bug to reopen the setup tour.', requestId: 'trusted-update-001' };
  await expect(unverified.mutation(ref<'mutation'>('bug:publishUpdate'), update)).rejects.toThrow('verified site editors');
  const forgedClaims = t.withIdentity({ subject: ids.player, email: 'editor@test.example', emailVerified: true });
  await expect(forgedClaims.mutation(ref<'mutation'>('bug:publishUpdate'), update)).rejects.toThrow('verified site editors');
  expect(await player.query(ref<'query'>('bug:canPublish'), {})).toBe(false);
  expect(await editor.query(ref<'query'>('bug:canPublish'), {})).toBe(true);
  const id = await editor.mutation(ref<'mutation'>('bug:publishUpdate'), update);
  expect(await editor.mutation(ref<'mutation'>('bug:publishUpdate'), update)).toBe(id);
  await expect(editor.mutation(ref<'mutation'>('bug:publishUpdate'), { ...update, body: 'Changed' })).rejects.toThrow('already belongs');
  expect((await t.query(ref<'query'>('chronicles:post'), { id })) as any).toMatchObject({ author: { handle: 'bug', official: 'bug' } });
});
test('following Bug includes his updates and sharing preserves attribution without duplicate posts', async () => {
  const { t, player, originalId } = await fixture();
  await player.mutation(ref<'mutation'>('chronicles:follow'), { handle: 'bug', enabled: true });
  expect(((await player.query(ref<'query'>('chronicles:feed'), { following: true })) as any).posts).toHaveLength(1);
  const id = await player.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId });
  expect(await player.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId })).toBe(id);
  const shared: any = await t.query(ref<'query'>('chronicles:post'), { id });
  expect(shared).toMatchObject({ originalPostId: originalId, author: { handle: 'bug', official: 'bug' }, sharedBy: { handle: 'player' } });
  expect(shared.title).toBe('Meet Bug, keeper of the code');
  const second = await t.mutation(ref<'mutation'>('bug:publishInternal'), { title: 'Another update', body: 'Another tip.', publicationKey: 'another-tip-001' });
  await expect(player.mutation(ref<'mutation'>('bug:shareUpdate'), { id: second })).rejects.toThrow('wait between');
  await player.mutation(ref<'mutation'>('chronicles:follow'), { handle: 'bug', enabled: false });
  expect(((await player.query(ref<'query'>('chronicles:feed'), { following: true })) as any).posts).toHaveLength(0);
});
test('hiding the original removes all shares from feeds, links, reactions and further sharing', async () => {
  const { t, player, originalId } = await fixture();
  const id = await player.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId });
  await t.run(ctx => ctx.db.patch(originalId, { hidden: true }));
  expect(await t.query(ref<'query'>('chronicles:post'), { id })).toBeNull();
  expect(((await t.query(ref<'query'>('chronicles:feed'), {})) as any).posts).toHaveLength(0);
  await expect(player.mutation(ref<'mutation'>('chronicles:toast'), { id })).rejects.toThrow('unavailable');
  await expect(player.mutation(ref<'mutation'>('chronicles:report'), { id, reason: 'test' })).rejects.toThrow('unavailable');
  await expect(player.mutation(ref<'mutation'>('bug:shareUpdate'), { id })).rejects.toThrow('unavailable');
  expect(await t.query(ref<'query'>('chronicles:post'), { id: 'not-an-id' })).toBeNull();
});
test('unreviewed players cannot repost and mutual blocks hide originals and shares', async () => {
  const { t, player, ids, originalId } = await fixture();
  await expect(t.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId })).rejects.toThrow('reviewed public profile');
  const stranger = t.withIdentity({ subject: ids.unverified });
  await expect(stranger.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId })).rejects.toThrow('reviewed public profile');
  const shareId = await player.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId });
  await t.run(async ctx => {
    const bug = await ctx.db.query('profiles').withIndex('by_handle', q => q.eq('handle', 'bug')).unique();
    await ctx.db.insert('friendBlocks', { ownerId: bug!.ownerId, blockedId: ids.player });
  });
  expect(await player.query(ref<'query'>('chronicles:post'), { id: shareId })).toBeNull();
  expect(((await player.query(ref<'query'>('chronicles:feed'), {})) as any).posts).toHaveLength(0);
  await expect(player.mutation(ref<'mutation'>('bug:shareUpdate'), { id: originalId })).rejects.toThrow('unavailable');
});
