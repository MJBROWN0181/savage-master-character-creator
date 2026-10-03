import { getAuthUserId } from '@convex-dev/auth/server';
import { v, ConvexError } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { reviewedAuthor, visiblePost } from './chronicleVisibility';

const bio = 'I’m Bug, Savage Master’s keeper of code. I help with setup, carry bug reports to the team, and share official updates from my tome.';
async function findBug(ctx: any) {
  const profile = await ctx.db.query('profiles').withIndex('by_handle', (q: any) => q.eq('handle', 'bug')).unique();
  return profile?.official === 'bug' ? profile : null;
}
async function ensure(ctx: any) {
  const old = await ctx.db.query('profiles').withIndex('by_handle', (q: any) => q.eq('handle', 'bug')).unique();
  if (old) {
    if (old.official !== 'bug') throw new ConvexError('The Bug profile address is occupied. A site administrator must review the conflict.');
    return old;
  }
  // A service identity with no login credentials or mailbox; players follow it as an author.
  const ownerId = await ctx.db.insert('users', { name: 'Bug' });
  const data = { ownerId, official: 'bug' as const, handle: 'bug', displayName: 'Bug', bio,
    games: ['Savage Worlds', 'Dungeons & Dragons 5e', 'Pathfinder 2e'], memory: '', roles: [],
    links: [{ label: 'Get support', url: 'https://smsheets.com/support', kind: 'social' as const }], favorites: [], highlights: [],
    appearance: { background: 'midnight', accent: 'gold', font: 'classic', layout: 'balanced', sections: ['about', 'games'] },
    ageConfirmedAt: Date.now(), updatedAt: Date.now(), reviewStatus: 'approved' as const,
    publicSnapshot: { handle: 'bug', displayName: 'Bug', bio, games: ['Savage Worlds', 'Dungeons & Dragons 5e', 'Pathfinder 2e'], memory: '', roles: [], links: [], favorites: [], highlights: [], appearance: { background: 'midnight', accent: 'gold', font: 'classic', layout: 'balanced', sections: ['about', 'games'] } },
  };
  const id = await ctx.db.insert('profiles', data);
  await ctx.db.insert('chroniclePreferences', { ownerId, allowFollowers: true });
  return { ...data, _id: id };
}
async function editor(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) return null;
  const user = await ctx.db.get(id);
  const allowed = (process.env.BUG_EDITOR_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  return user?.emailVerificationTime && allowed.includes(user.email?.toLowerCase() || '') ? id : null;
}
function text(title: string, body: string, key: string) {
  if (!title.trim() || title.trim().length > 100 || !body.trim() || body.trim().length > 2000 || !/^[\w-]{8,100}$/.test(key)) throw new ConvexError('Use a title up to 100 characters and an update up to 2,000 characters.');
}
export async function publishAsBug(ctx: any, title: string, body: string, key: string, publishedBy?: any, game = 'Any tabletop game', kind = 'Official update') {
  text(title, body, key);
  const bug = await ensure(ctx);
  const old = await ctx.db.query('chroniclePosts').withIndex('by_publication', (q: any) => q.eq('publicationKey', key)).unique();
  if (old) {
    // GitHub retries retain their original note even if wording changes in a later release.
    if (old.ownerId !== bug.ownerId || (!/^github-[a-f0-9]{64}$/.test(key) && (old.title !== title.trim() || old.body !== body.trim()))) throw new ConvexError('This update key already belongs to another post.');
    return old._id;
  }
  return ctx.db.insert('chroniclePosts', { ownerId: bug.ownerId, title: title.trim(), body: body.trim(), game, kind, createdAt: Date.now(), toastCount: 0, hidden: false, publicationKey: key, publishedBy });
}
export const ensureProfile = internalMutation({
  args: {}, handler: async ctx => {
    const bug = await ensure(ctx);
    await publishAsBug(ctx, 'Meet Bug, keeper of the code', 'I’m Bug. Follow my Chronicles for official Savage Master updates and helpful tips. If something goes wrong, use the Bug button to reach support. Share these public updates with your table; your support tickets and private journals stay private.', 'bug-welcome-v1');
    return { handle: bug.handle, profileId: bug._id };
  },
});
export const profile = query({ args: {}, handler: async ctx => {
  const bug = await findBug(ctx);
  if (!bug || !await reviewedAuthor(ctx, bug.ownerId)) return null;
  return { name: 'Bug', handle: 'bug', bio, avatar: '/images/art/the-bug.png', official: true };
} });
export const canPublish = query({ args: {}, handler: async ctx => !!await editor(ctx) });
export const publishUpdate = mutation({
  args: { title: v.string(), body: v.string(), requestId: v.string() },
  handler: async (ctx, args) => {
    const id = await editor(ctx);
    if (!id) throw new ConvexError('Only verified site editors can publish as Bug.');
    return publishAsBug(ctx, args.title, args.body, 'bug-' + args.requestId, id);
  },
});
export const publishInternal = internalMutation({
  args: { title: v.string(), body: v.string(), publicationKey: v.string() },
  handler: (ctx, args) => publishAsBug(ctx, args.title, args.body, args.publicationKey),
});
export const shareUpdate = mutation({
  args: { id: v.id('chroniclePosts') },
  handler: async (ctx, { id }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId || !await reviewedAuthor(ctx, ownerId)) throw new ConvexError('Sign in with a reviewed public profile to share an update to Chronicles.');
    const row = await ctx.db.get(id);
    if (!await visiblePost(ctx, row, ownerId)) throw new ConvexError('This update is unavailable.');
    const originalId = row?.originalPostId || id;
    const original = await visiblePost(ctx, await ctx.db.get(originalId), ownerId);
    if (!original || original.author.official !== 'bug') throw new ConvexError('This update is unavailable.');
    const old = await ctx.db.query('chroniclePosts').withIndex('by_original_owner', q => q.eq('originalPostId', originalId).eq('ownerId', ownerId)).unique();
    if (old && !old.hidden) return old._id;
    const recent = await ctx.db.query('chroniclePosts').withIndex('by_owner', q => q.eq('ownerId', ownerId)).order('desc').take(20);
    if (recent.some(post => Date.now() - post.createdAt < 30000) || recent.filter(post => Date.now() - post.createdAt < 86400000).length >= 20) throw new ConvexError('Please wait between posts. You can share up to 20 posts per day.');
    if (old) { await ctx.db.patch(old._id, { hidden: false, createdAt: Date.now() }); return old._id; }
    return ctx.db.insert('chroniclePosts', { ownerId, originalPostId: originalId, title: '', body: '', game: original.post.game, kind: 'Shared update', toastCount: 0, hidden: false, createdAt: Date.now() });
  },
});
