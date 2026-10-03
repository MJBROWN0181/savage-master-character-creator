import { getAuthUserId } from '@convex-dev/auth/server';
import { v, ConvexError } from 'convex/values';
import { makeFunctionReference as ref } from 'convex/server';
import { query, mutation, internalMutation, type QueryCtx, type MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { moderationRole } from './moderationAccess';

type Kind = 'founding-100' | 'founding-50-supporters';
export async function isProfileAdmin(ctx: QueryCtx, ownerId: Id<'users'>) {
  return ['owner', 'admin'].includes(await moderationRole(ctx, ownerId));
}
async function counter(ctx: MutationCtx, kind: Kind) {
  const old = await ctx.db.query('profileFrameCounters').withIndex('by_kind', q => q.eq('kind', kind)).unique();
  if (old) return old;
  const id = await ctx.db.insert('profileFrameCounters', { kind, count: 0, initialized: kind !== 'founding-100' });
  return (await ctx.db.get(id))!;
}
async function award(ctx: MutationCtx, ownerId: Id<'users'>, kind: Kind, paymentId?: string) {
  if (await ctx.db.query('profileFrameAwards').withIndex('by_owner_kind', q => q.eq('ownerId', ownerId).eq('kind', kind)).unique()) return;
  const state = await counter(ctx, kind), limit = kind === 'founding-100' ? 100 : 50;
  if (state.count >= limit) return;
  await ctx.db.insert('profileFrameAwards', { ownerId, kind, number: state.count + 1, awardedAt: Date.now(), ...(paymentId ? { paymentId } : {}) });
  await ctx.db.patch(state._id, { count: state.count + 1 });
}
export async function awardVerifiedMember(ctx: MutationCtx, ownerId: Id<'users'>) {
  const user = await ctx.db.get(ownerId);
  if (!user?.emailVerificationTime) return;
  const existing = await ctx.db.query('profileFrameCounters').withIndex('by_kind', q => q.eq('kind', 'founding-100')).unique();
  if (!existing) {
    await counter(ctx, 'founding-100');
    await ctx.scheduler.runAfter(0, ref<'mutation', any>('profileFrames:backfillMembers'), { cursor: null });
  } else if (existing.initialized) await award(ctx, ownerId, 'founding-100');
}
// Existing verified accounts are seeded in signup order. Lifetime counters never reuse slots.
export const backfillMembers = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const state = await counter(ctx, 'founding-100');
    if (state.initialized) return;
    const page = await ctx.db.query('users').order('asc').paginate({ cursor, numItems: 100 });
    for (const user of page.page) if (user.emailVerificationTime) await award(ctx, user._id, 'founding-100');
    const current = (await ctx.db.get(state._id))!;
    if (page.isDone || current.count >= 100) await ctx.db.patch(state._id, { initialized: true });
    else await ctx.scheduler.runAfter(0, ref<'mutation', any>('profileFrames:backfillMembers'), { cursor: page.continueCursor });
  },
});
// Called only by internal billing after PayPal verifies an actual live payment.
export async function awardLiveSupporter(ctx: MutationCtx, ownerId: Id<'users'>, paymentId: string) {
  if (!await ctx.db.get(ownerId)) return;
  await award(ctx, ownerId, 'founding-50-supporters', paymentId);
}
export async function profileFrame(ctx: QueryCtx, ownerId: Id<'users'>) {
  const user = await ctx.db.get(ownerId);
  if (!user) return { active: null, available: [] as string[], enabled: true, selection: 'auto' };
  const awards = await ctx.db.query('profileFrameAwards').withIndex('by_owner_kind', q => q.eq('ownerId', ownerId)).collect();
  const available: string[] = [];
  if (await isProfileAdmin(ctx, ownerId)) available.push('admin');
  for (const kind of ['founding-50-supporters', 'founding-100'] as const) if (awards.some(a => a.kind === kind)) available.push(kind);
  const requested = user.profileFrameSelection || 'auto';
  const selection = requested === 'auto' || available.includes(requested) ? requested : 'auto', enabled = user.profileFrameEnabled !== false;
  return { active: enabled ? selection === 'auto' ? available[0] || null : available.includes(selection) ? selection : null : null, available, enabled, selection };
}
export const mine = query({ args: {}, handler: async ctx => {
  const ownerId = await getAuthUserId(ctx);
  return ownerId ? profileFrame(ctx, ownerId) : null;
} });
export const setPreference = mutation({
  args: { enabled: v.boolean(), selection: v.union(v.literal('auto'), v.literal('admin'), v.literal('founding-100'), v.literal('founding-50-supporters')) },
  handler: async (ctx, { enabled, selection }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new ConvexError('Sign in to choose a profile frame.');
    const frames = await profileFrame(ctx, ownerId);
    if (selection !== 'auto' && !frames.available.includes(selection)) throw new ConvexError('Choose a frame earned by your account.');
    await ctx.db.patch(ownerId, { profileFrameEnabled: enabled, profileFrameSelection: selection });
  },
});
