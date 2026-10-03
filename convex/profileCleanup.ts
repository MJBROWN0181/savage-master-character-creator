import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { makeFunctionReference as ref } from 'convex/server';
export const run = internalMutation({ args: { ownerId: v.id('users'), before: v.number() }, handler: async (ctx, a) => {
  let remaining = false;
  for (const table of ['chroniclePosts','bazaarListings','chronicleTomes'] as const) {
    const rows = await ctx.db.query(table).withIndex('by_owner', q => q.eq('ownerId', a.ownerId))
      .filter(q => q.and(q.lte(q.field('createdAt'), a.before), q.neq(q.field('hidden'), true))).take(50);
    for (const row of rows) await ctx.db.patch(row._id, { hidden: true });
    if (rows.length === 50) remaining = true;
  }
  const messages = await ctx.db.query('guildMessages').withIndex('by_owner_request', q => q.eq('ownerId', a.ownerId)).filter(q => q.and(q.lte(q.field('createdAt'), a.before),q.neq(q.field('hidden'),true))).take(50);
  for (const row of messages) await ctx.db.patch(row._id, { hidden: true });
  if (messages.length === 50) remaining = true;
  const media = await ctx.db.query('profileMedia').withIndex('by_owner', q => q.eq('ownerId', a.ownerId)).filter(q => q.lte(q.field('createdAt'),a.before)).take(50);
  for (const row of media) { await ctx.storage.delete(row.storageId); await ctx.db.delete(row._id); }
  if (media.length === 50) remaining = true;
  const members = await ctx.db.query('chronicleMembers').withIndex('by_owner',q => q.eq('ownerId',a.ownerId)).filter(q => q.lte(q.field('_creationTime'),a.before)).take(50);
  for (const row of members) await ctx.db.delete(row._id);
  if (members.length === 50) remaining = true;
  const events = await ctx.db.query('guildEvents').withIndex('by_owner', q => q.eq('ownerId', a.ownerId)).filter(q => q.and(q.lte(q.field('createdAt'),a.before),q.eq(q.field('cancelled'),false))).take(50);
  for (const row of events) await ctx.db.patch(row._id,{cancelled:true});
  if (events.length === 50) remaining = true;
  for (const index of ['by_owner','by_target'] as const) {
    const follows = await ctx.db.query('chronicleFollows').withIndex(index, q => index === 'by_owner' ? q.eq('ownerId',a.ownerId) : q.eq('targetId',a.ownerId)).filter(q => q.lte(q.field('_creationTime'),a.before)).take(50);
    for (const row of follows) await ctx.db.delete(row._id);
    if (follows.length === 50) remaining = true;
  }
  const rsvps = await ctx.db.query('guildRsvps').withIndex('by_owner', q => q.eq('ownerId',a.ownerId)).filter(q => q.lte(q.field('_creationTime'),a.before)).take(50);
  for (const row of rsvps) await ctx.db.delete(row._id);
  if (rsvps.length === 50) remaining = true;
  for (const index of ['by_sender','by_recipient'] as const) {
    const friends = await ctx.db.query('friendships').withIndex(index, q => index === 'by_sender' ? q.eq('senderId',a.ownerId) : q.eq('recipientId',a.ownerId)).filter(q => q.lte(q.field('_creationTime'),a.before)).take(50);
    for (const row of friends) await ctx.db.delete(row._id);
    if (friends.length === 50) remaining = true;
  }
  if (remaining) await ctx.scheduler.runAfter(0, ref<'mutation',any>('profileCleanup:run'), a);
} });
