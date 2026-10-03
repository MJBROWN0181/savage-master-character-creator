import { query, mutation, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator, makeFunctionReference as ref } from 'convex/server';
import { moderatorId, moderationRole, isModerationOwner } from './moderationAccess';

export const initializeOwner = internalMutation({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const existing = await ctx.db.query('moderationOwners').withIndex('by_key', q => q.eq('key', 'primary')).unique();
    if (existing) return { configured: true };
    const profile = await ctx.db.query('profiles').withIndex('by_handle', q => q.eq('handle', handle)).unique();
    const user = profile && await ctx.db.get(profile.ownerId);
    if (!profile || !user?.emailVerificationTime) throw new Error('Owner profile must exist and have a verified account.');
    await ctx.db.insert('moderationOwners', { key: 'primary', userId: profile.ownerId, createdAt: Date.now() });
    return { configured: true };
  },
});
export const repairPendingNotices = internalMutation({
  args: {}, handler: async ctx => {
    const profiles = await ctx.db.query('profiles').withIndex('by_review', q => q.eq('reviewStatus', 'pending')).take(100);
    let repaired = 0;
    for (const p of profiles) {
      if (p.reviewNotification === 'sent' || (p.reviewNotification === 'pending' && p.reviewRequestedAt)) continue;
      const requestedAt = Date.now();
      await ctx.db.patch(p._id, { reviewRequestedAt: requestedAt, reviewNotification: 'pending' });
      await ctx.scheduler.runAfter(0, ref<'action', any>('profileReviewEmail:notify'), { profileId: p._id, requestedAt, attempt: 0 });
      repaired++;
    }
    return { repaired };
  },
});
export const mine = query({ args: {}, handler: async ctx => {
  const id = await getAuthUserId(ctx);
  return { role: id ? await moderationRole(ctx, id) : 'member' };
}});
export const members = query({
  args: { paginationOpts: paginationOptsValidator }, handler: async (ctx, args) => {
    if (!await moderatorId(ctx)) throw new ConvexError('Staff access required.');
    const page = await ctx.db.query('users').order('desc').paginate({ ...args.paginationOpts, numItems: Math.min(50, args.paginationOpts.numItems) });
    return { ...page, page: await Promise.all(page.page.map(async user => {
      const p = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('ownerId', user._id)).unique();
      return { memberId: user._id, handle: p?.handle || null, reviewStatus: p?.reviewStatus || 'no_profile', verified: !!user.emailVerificationTime,
        role: await moderationRole(ctx, user._id), communityPaused: user.communityPausedAt !== undefined };
    })) };
  },
});
export const setCommunityAccess = mutation({
  args: { memberId: v.id('users'), paused: v.boolean() }, handler: async (ctx, { memberId, paused }) => {
    const actorId = await moderatorId(ctx);
    if (!actorId) throw new ConvexError('Staff access required.');
    const user = await ctx.db.get(memberId);
    if (!user) throw new ConvexError('Member unavailable.');
    const primary = await ctx.db.query('moderationOwners').withIndex('by_key', q => q.eq('key', 'primary')).unique();
    if (memberId === actorId || memberId === primary?.userId || await isModerationOwner(ctx, memberId)) throw new ConvexError('Your own account and the owner account are protected.');
    // Protect staff accounts even while community access is paused.
    const grant = await ctx.db.query('profileReviewTeam').withIndex('by_user', q => q.eq('userId', memberId)).unique();
    const legacy = user.email ? await ctx.db.query('profileReviewTeam').withIndex('by_email', q => q.eq('email', user.email)).unique() : null;
    const staffGrant = grant || legacy;
    if ((await moderationRole(ctx, memberId, true) !== 'member' || (staffGrant && staffGrant.revokedAt === undefined)) && !await isModerationOwner(ctx, actorId)) throw new ConvexError('Only the owner can change staff account access.');
    await ctx.db.patch(memberId, { communityPausedAt: paused ? Date.now() : undefined });
    await ctx.db.insert('moderationAudit', { actorId, memberId, action: paused ? 'community_paused' : 'community_restored', createdAt: Date.now() });
  },
});
export const bugReports = query({ args: {}, handler: async ctx => {
  if (!await moderatorId(ctx)) throw new ConvexError('Staff access required.');
  const tickets = await ctx.db.query('supportTickets').withIndex('by_created').order('desc').take(100);
  // Original messages and diagnostics may contain personal information. Never return them to staff.
  return tickets.filter(t => t.kind === 'bug').map(t => ({ id: t._id, category: t.category || 'other', status: t.status, createdAt: t.createdAt, updatedAt: t.updatedAt }));
}});
export const updateBugReport = mutation({
  args: { id: v.id('supportTickets'), updatedAt: v.number(), status: v.union(v.literal('open'), v.literal('in_progress'), v.literal('resolved')) },
  handler: async (ctx, args) => {
    const actorId = await moderatorId(ctx);
    if (!actorId) throw new ConvexError('Staff access required.');
    const ticket = await ctx.db.get(args.id);
    if (!ticket || ticket.kind !== 'bug' || ticket.updatedAt !== args.updatedAt) throw new ConvexError('Ticket changed. Refresh before updating.');
    await ctx.db.patch(ticket._id, { status: args.status, updatedAt: Date.now() });
    await ctx.db.insert('moderationAudit', { actorId, ticketId: ticket._id, action: `bug_${args.status}`, createdAt: Date.now() });
  },
});
