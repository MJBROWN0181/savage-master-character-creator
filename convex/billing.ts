import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import {query, internalQuery, internalMutation} from './_generated/server';
import {accessTier, checkoutReady, environment} from './billingModel';

const paidTier = v.union(v.literal('chronicle'), v.literal('storykeeper'));
export const summary = query({args: {}, handler: async ctx => {
  const ownerId = await getAuthUserId(ctx);
  const configuration = {checkoutReady: checkoutReady(), environment: environment(),
    credentialsConfigured: !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET,
    webhookConfigured: !!process.env.PAYPAL_WEBHOOK_ID};
  if (!ownerId) return {...configuration, tier: 'free', subscription: null};
  const rows = await ctx.db.query('billingSubscriptions').withIndex('by_owner', q => q.eq('ownerId', ownerId)).collect();
  const current = rows.filter(r => r.environment === environment()).sort((a, b) => b.createdAt - a.createdAt)[0];
  const tier = accessTier(rows);
  return {...configuration, tier,
    subscription: current ? {tier: current.tier, status: current.status, paidThrough: current.paidThrough || 0,
      syncedAt: current.syncedAt || 0, hasSubscription: !!current.subscriptionId, approvalUrl: current.approvalUrl || null} : null};
}});

export const reserveCheckout = internalMutation({
  args: {ownerId: v.id('users'), tier: paidTier, planId: v.string(), requestId: v.string()},
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('billingSubscriptions').withIndex('by_owner', q => q.eq('ownerId', args.ownerId)).collect();
    const current = rows.filter(r => r.environment === environment()).sort((a, b) => b.createdAt - a.createdAt)[0];
    if (current && (!['CANCELLED', 'EXPIRED', 'ABANDONED'].includes(current.status) || (current.paidThrough || 0) > Date.now())) {
      if (['CREATING', 'APPROVAL_PENDING', 'APPROVED'].includes(current.status) && current.tier === args.tier) return current;
      throw new Error('You already have a subscription or checkout in progress. Manage it before choosing another plan.');
    }
    const id = await ctx.db.insert('billingSubscriptions', {...args, environment: environment(), status: 'CREATING', createdAt: Date.now()});
    return (await ctx.db.get(id))!;
  },
});
export const attachCheckout = internalMutation({
  args: {id: v.id('billingSubscriptions'), subscriptionId: v.string(), approvalUrl: v.string()},
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.environment !== environment()) throw new Error('Checkout not found.');
    const other = await ctx.db.query('billingSubscriptions').withIndex('by_subscription', q => q.eq('subscriptionId', args.subscriptionId)).unique();
    if (other && other._id !== row._id) throw new Error('Subscription is already linked.');
    if (row.subscriptionId && row.subscriptionId !== args.subscriptionId) throw new Error('Checkout is already linked.');
    // A webhook may have settled payment before the browser receives this response.
    await ctx.db.patch(row._id, {subscriptionId: args.subscriptionId, approvalUrl: args.approvalUrl,
      ...(row.status === 'CREATING' ? {status: 'APPROVAL_PENDING'} : {})});
  },
});
export const currentForOwner = internalQuery({args: {ownerId: v.id('users')}, handler: async (ctx, {ownerId}) => {
  const rows = await ctx.db.query('billingSubscriptions').withIndex('by_owner', q => q.eq('ownerId', ownerId)).collect();
  return rows.filter(r => r.environment === environment()).sort((a, b) => b.createdAt - a.createdAt)[0] || null;
}});
export const findSubscription = internalQuery({args: {subscriptionId: v.string()}, handler: async (ctx, {subscriptionId}) =>
  ctx.db.query('billingSubscriptions').withIndex('by_subscription', q => q.eq('subscriptionId', subscriptionId)).unique(),
});
export const findCheckout = internalQuery({args: {customId: v.string()}, handler: async (ctx, {customId}) => {
  const id = ctx.db.normalizeId('billingSubscriptions', customId);
  return id ? ctx.db.get(id) : null;
}});
export const seenEvent = internalQuery({args: {eventId: v.string()}, handler: async (ctx, {eventId}) =>
  !!await ctx.db.query('billingEvents').withIndex('by_event', q => q.eq('eventId', eventId)).unique(),
});
export const applyState = internalMutation({
  args: {id: v.id('billingSubscriptions'), subscriptionId: v.string(), status: v.string(), paidThrough: v.number(),
    paymentId: v.optional(v.string()), syncStartedAt: v.number(), eventId: v.optional(v.string()), blockTransactionId: v.optional(v.string())},
  handler: async (ctx, args) => {
    if (args.eventId && await ctx.db.query('billingEvents').withIndex('by_event', q => q.eq('eventId', args.eventId!)).unique()) return;
    const row = await ctx.db.get(args.id);
    if (!row || row.environment !== environment() || (row.subscriptionId && row.subscriptionId !== args.subscriptionId)) throw new Error('Subscription not found.');
    if (args.blockTransactionId && !await ctx.db.query('billingPaymentBlocks').withIndex('by_transaction', q => q.eq('transactionId', args.blockTransactionId!)).unique()) {
      await ctx.db.insert('billingPaymentBlocks', {transactionId: args.blockTransactionId, createdAt: Date.now()});
    }
    const blocked = args.paymentId && await ctx.db.query('billingPaymentBlocks').withIndex('by_transaction', q => q.eq('transactionId', args.paymentId!)).unique();
    if (args.syncStartedAt >= (row.syncStartedAt || 0)) {
      // Cancellation cannot be undone by an older concurrent ACTIVE response.
      const status = ['CANCELLED', 'EXPIRED'].includes(row.status) ? row.status : args.status;
      await ctx.db.patch(row._id, {subscriptionId: args.subscriptionId, status, paidThrough: blocked ? 0 : args.paidThrough,
        paymentId: args.paymentId, syncedAt: Date.now(), syncStartedAt: args.syncStartedAt});
    } else if (args.blockTransactionId === row.paymentId) {
      await ctx.db.patch(row._id, {paidThrough: 0});
    }
    if (args.eventId) await ctx.db.insert('billingEvents', {eventId: args.eventId, receivedAt: Date.now()});
  },
});
export const blockPayment = internalMutation({args: {transactionId: v.string()}, handler: async (ctx, {transactionId}) => {
  if (!await ctx.db.query('billingPaymentBlocks').withIndex('by_transaction', q => q.eq('transactionId', transactionId)).unique()) {
    await ctx.db.insert('billingPaymentBlocks', {transactionId, createdAt: Date.now()});
  }
  // A payment's reversal can arrive after the subscription's newer status event.
  const rows = await ctx.db.query('billingSubscriptions').withIndex('by_payment', q => q.eq('paymentId', transactionId)).collect();
  for (const row of rows) if (row.environment === environment()) await ctx.db.patch(row._id, {paidThrough: 0});
}});
export const markEvent = internalMutation({args: {eventId: v.string()}, handler: async (ctx, {eventId}) => {
  if (!await ctx.db.query('billingEvents').withIndex('by_event', q => q.eq('eventId', eventId)).unique()) await ctx.db.insert('billingEvents', {eventId, receivedAt: Date.now()});
}});
export const markCancelled = internalMutation({args: {id: v.id('billingSubscriptions')}, handler: async (ctx, {id}) => {
  const row = await ctx.db.get(id); if (!row || row.environment !== environment()) throw new Error('Subscription not found.');
  await ctx.db.patch(id, {status: 'CANCELLED', approvalUrl: undefined, syncedAt: Date.now(), syncStartedAt: Date.now()});
}});
export const syncPage = internalQuery({args: {cursor: v.union(v.string(), v.null())}, handler: async (ctx, {cursor}) =>
  ctx.db.query('billingSubscriptions').paginate({cursor, numItems: 25}),
});
