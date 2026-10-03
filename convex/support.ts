import { getAuthUserId } from '@convex-dev/auth/server';
import { v, ConvexError } from 'convex/values';
import { makeFunctionReference as ref } from 'convex/server';
import { mutation, query, internalQuery, internalMutation } from './_generated/server';

export const submit = mutation({
  args: { requestId: v.string(), kind: v.union(v.literal('bug'), v.literal('help')), title: v.string(), body: v.string(), email: v.string(), diagnostics: v.optional(v.string()), category: v.optional(v.union(v.literal('characters'), v.literal('campaigns'), v.literal('profiles'), v.literal('community'), v.literal('billing'), v.literal('other'))) },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx) ?? undefined;
    const email = args.email.trim().toLowerCase();
    const title = args.title.trim(), body = args.body.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ConvexError('Enter a valid reply email.');
    if (!title || title.length > 160 || !body || body.length > 6000) throw new ConvexError('Add a short title and a description of up to 6,000 characters.');
    if (!/^[\w-]{20,80}$/.test(args.requestId) || (args.diagnostics?.length ?? 0) > 20000) throw new ConvexError('Report details are too large.');
    const old = await ctx.db.query('supportTickets').withIndex('by_request', q => q.eq('requestId', args.requestId)).unique();
    if (old) {
      if (old.ownerId !== ownerId || old.email !== email) throw new ConvexError('Please start a new report.');
      return { id: old._id, reference: old.reference };
    }
    const now = Date.now();
    const recent = await ctx.db.query('supportTickets').withIndex('by_email_created', q => q.eq('email', email).gt('createdAt', now - 86400000)).take(6);
    const own = ownerId ? await ctx.db.query('supportTickets').withIndex('by_owner_created', q => q.eq('ownerId', ownerId).gt('createdAt', now - 86400000)).take(6) : [];
    if (recent.length >= 5 || own.length >= 5 || [...recent, ...own].some(ticket => ticket.createdAt > now - 60000)) throw new ConvexError('Please wait a minute between reports. You can send up to five tickets per day.');
    // Bound abuse from guest submissions; the guest queue has no public read API.
    const hourly = await ctx.db.query('supportTickets').withIndex('by_created', q => q.gt('createdAt', now - 3600000)).take(101);
    if (hourly.length >= 100) throw new ConvexError('Support is receiving many reports. Please keep your draft and try again shortly.');
    const reference = 'BUG-' + args.requestId.toUpperCase();
    const id = await ctx.db.insert('supportTickets', { ...args, title, body, email, ownerId, reference, status: 'open', createdAt: now, updatedAt: now, notification: 'pending' });
    await ctx.scheduler.runAfter(0, ref<'action', any>('supportEmail:notify'), { id, attempt: 0 });
    return { id, reference };
  },
});

export const mine = query({
  args: {},
  handler: async ctx => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) return [];
    const rows = await ctx.db.query('supportTickets').withIndex('by_owner_created', q => q.eq('ownerId', ownerId)).order('desc').take(30);
    return rows.map(({ _id, reference, kind, title, body, status, createdAt, reply }) => ({ _id, reference, kind, title, body, status, createdAt, reply }));
  },
});

// Team access is internal only: use the Convex dashboard or an authorized CLI.
export const queue = internalQuery({ args: {}, handler: ctx => ctx.db.query('supportTickets').withIndex('by_created').order('desc').take(100) });
export const getForNotification = internalQuery({ args: { id: v.id('supportTickets') }, handler: (ctx, { id }) => ctx.db.get(id) });
export const markNotification = internalMutation({
  args: { id: v.id('supportTickets'), notification: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed'), v.literal('unconfigured')) },
  handler: (ctx, { id, notification }) => ctx.db.patch(id, { notification }),
});
export const respond = internalMutation({
  args: { id: v.id('supportTickets'), status: v.union(v.literal('open'), v.literal('in_progress'), v.literal('resolved')), reply: v.string() },
  handler: async (ctx, { id, status, reply }) => {
    if (reply.length > 6000) throw new Error('Reply is too long.');
    await ctx.db.patch(id, { status, reply: reply.trim(), updatedAt: Date.now() });
  },
});
