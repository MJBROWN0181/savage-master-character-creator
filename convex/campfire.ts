import { query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { publicPost, reviewedAuthor, mutuallyBlocked } from './chronicleVisibility';
import { deck, mixedDeck } from './campfireOrder';
export const page = query({
  args: { seed: v.string(), offset: v.number(), game: v.optional(v.string()) },
  handler: async (ctx, a) => {
    if (a.seed.length > 100 || !Number.isSafeInteger(a.offset) || a.offset < 0 || a.offset > 1000000) throw new Error('Refresh the fire to start a new feed.');
    const viewer = await getAuthUserId(ctx);
    const follows = viewer ? await ctx.db.query('chronicleFollows').withIndex('by_owner', q => q.eq('ownerId', viewer)).take(200) : [];
    const followed = new Set<string>(), followRows = [];
    for (const f of follows) {
      const prefs = await ctx.db.query('chroniclePreferences').withIndex('by_owner', q => q.eq('ownerId', f.targetId)).unique();
      if (prefs?.allowFollowers === false || !await reviewedAuthor(ctx, f.targetId) || await mutuallyBlocked(ctx, viewer, f.targetId)) continue;
      followed.add(f.targetId);
      followRows.push(...await ctx.db.query('chroniclePosts').withIndex('by_owner', q => q.eq('ownerId', f.targetId)).order('desc').take(12));
    }
    const recent = await ctx.db.query('chroniclePosts').withIndex('by_created').order('desc').take(120);
    const filter = (p: any) => !p.hidden && (!a.game || a.game === 'All games' || p.game === a.game);
    // Hydrate once per candidate. This applies the same privacy/block/removal policy as links and reactions.
    const hydrate = async (rows: any[]) => {
      const visible = [];
      for (const row of rows.filter(filter)) {
        const guild: any = row.tomeId ? await ctx.db.get(row.tomeId) : null;
        if (guild?.visibility === 'private') continue;
        const post = await publicPost(ctx, row, viewer);
        if (post) visible.push(post);
        if (visible.length >= 60) break;
      }
      return deck(visible, a.seed);
    };
    const following = await hydrate(deck(followRows, a.seed));
    const discovery = await hydrate(recent.filter(p => !followed.has(p.ownerId)));
    const posts = mixedDeck(following, discovery, a.offset);
    return { posts, following, discovery, next: posts.length ? a.offset + posts.length : null, followingAvailable: following.length > 0, discoveryAvailable: discovery.length > 0, available: following.length + discovery.length };
  },
});
