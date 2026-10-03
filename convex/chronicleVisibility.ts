// Shared by the feed, permalinks, reactions, and reposts: one visibility policy.
export async function reviewedAuthor(ctx: any, id: any) {
  if ((await ctx.db.get(id))?.communityPausedAt !== undefined) return null;
  const profile = await ctx.db.query('profiles').withIndex('by_owner', (q: any) => q.eq('ownerId', id)).unique();
  return profile?.reviewStatus === 'approved' && profile.publicSnapshot ? profile : null;
}
export async function mutuallyBlocked(ctx: any, viewer: any, owner: any) {
  if (!viewer) return false;
  for (const [a, b] of [[viewer, owner], [owner, viewer]]) {
    if (await ctx.db.query('friendBlocks').withIndex('by_owner_blocked', (q: any) => q.eq('ownerId', a).eq('blockedId', b)).unique()) return true;
  }
  return false;
}
export async function visiblePost(ctx: any, post: any, viewer: any): Promise<any> {
  if (!post || post.hidden || await mutuallyBlocked(ctx, viewer, post.ownerId)) return null;
  const author = await reviewedAuthor(ctx, post.ownerId);
  if (!author) return null;
  if (post.tomeId) {
    const tome = await ctx.db.get(post.tomeId);
    if (!tome || tome.hidden || !await reviewedAuthor(ctx, tome.ownerId) || await mutuallyBlocked(ctx, viewer, tome.ownerId)) return null;
    if (tome.visibility === 'private') {
      if (!viewer) return null;
      const member = await ctx.db.query('chronicleMembers').withIndex('by_tome_owner', (q: any) => q.eq('tomeId', tome._id).eq('ownerId', viewer)).unique();
      if (!member || member.status === 'invited') return null;
    }
  }
  if (post.originalPostId) {
    const original = await ctx.db.get(post.originalPostId);
    // Reposts always refer directly to an original visible public post.
    if (!original || original.originalPostId) return null;
    const source = await visiblePost(ctx, original, viewer);
    if (!source) return null;
    if (original.tomeId && (await ctx.db.get(original.tomeId))?.visibility === 'private') return null;
    return { post, author, source };
  }
  return { post, author, source: null };
}
export async function publicPost(ctx: any, row: any, viewer: any) {
  const visible = await visiblePost(ctx, row, viewer);
  if (!visible) return null;
  const { author: sharer, source } = visible;
  const post = source?.post || row, author = source?.author || sharer;
  const preferences = await ctx.db.query('chroniclePreferences').withIndex('by_owner', (q: any) => q.eq('ownerId', author.ownerId)).unique();
  const tome = post.tomeId ? await ctx.db.get(post.tomeId) : null;
  return {
    _id: row._id, createdAt: row.createdAt, title: post.title, body: post.body, game: post.game, kind: post.kind,
    toastCount: row.toastCount, originalPostId: row.originalPostId, public: tome?.visibility !== 'private',
    author: { name: author.publicSnapshot.displayName || author.handle, handle: author.handle,
      official: author.official === 'bug' ? 'bug' : undefined,
      avatar: author.official === 'bug' ? '/images/art/the-bug.png' : author.publicSnapshot.avatarId ? await ctx.storage.getUrl(author.publicSnapshot.avatarId) : null },
    sharedBy: source ? { name: sharer.publicSnapshot.displayName || sharer.handle, handle: sharer.handle } : null,
    mine: viewer === row.ownerId, allowFollowers: preferences?.allowFollowers !== false,
    toasted: viewer ? !!await ctx.db.query('chronicleToasts').withIndex('by_post_owner', (q: any) => q.eq('postId', row._id).eq('ownerId', viewer)).unique() : false,
  };
}
