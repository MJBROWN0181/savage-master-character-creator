import {getAuthUserId} from '@convex-dev/auth/server';
import {makeFunctionReference as ref} from 'convex/server';
import {v} from 'convex/values';
import {action, internalAction, httpAction, type ActionCtx} from './_generated/server';
import type {Doc} from './_generated/dataModel';
import {assertMonthlyPlan, checkoutReady, configuredPlan, environment, verifiedState} from './billingModel';
import {PayPalClient, subscriptionPath, approvalLink, billingReturnUrl} from './paypalClient';

const queryRef = (name: string) => ref<'query'>('billing:' + name);
const mutationRef = (name: string) => ref<'mutation'>('billing:' + name);
async function owner(ctx: ActionCtx) {
  const id = await getAuthUserId(ctx); if (!id) throw new Error('Sign in to manage your subscription.'); return id;
}
async function synchronize(ctx: ActionCtx, row: Doc<'billingSubscriptions'>, paypal = new PayPalClient(), eventId?: string) {
  if (!row.subscriptionId || row.environment !== environment()) throw new Error('Subscription not found.');
  const started = Date.now(), path = subscriptionPath(row.subscriptionId);
  const details = await paypal.request(path);
  const start = new Date(Math.max(row.createdAt - 300000, started - 40 * 86400000)).toISOString();
  const end = new Date(started).toISOString();
  const result = await paypal.request(path + '/transactions?start_time=' + encodeURIComponent(start) + '&end_time=' + encodeURIComponent(end));
  if (!Array.isArray(result.transactions) || result.total_pages > 1) throw new Error('PayPal payment history could not be verified. Please try again later.');
  const state = verifiedState(details, result.transactions, row, started);
  await ctx.runMutation(mutationRef('applyState'), {id: row._id, subscriptionId: row.subscriptionId, ...state, syncStartedAt: started, ...(eventId ? {eventId} : {})});
  return state;
}
export const startCheckout = action({
  args: {tier: v.union(v.literal('chronicle'), v.literal('storykeeper'))},
  handler: async (ctx, {tier}) => {
    const ownerId = await owner(ctx);
    if (!checkoutReady()) throw new Error('Paid checkout is not available yet. Your free account is ready to use.');
    const planId = configuredPlan(tier), paypal = new PayPalClient();
    assertMonthlyPlan(await paypal.request('/v1/billing/plans/' + planId), tier);
    const row: Doc<'billingSubscriptions'> = await ctx.runMutation(mutationRef('reserveCheckout'), {ownerId, tier, planId, requestId: crypto.randomUUID()});
    if (row.subscriptionId && row.approvalUrl) return {approvalUrl: row.approvalUrl};
    // Do not repeat ambiguous creations beyond PayPal's 72-hour idempotency window.
    if (Date.now() - row.createdAt > 70 * 3600000) throw new Error('This checkout needs support review before it can be retried. No second subscription has been created.');
    const result = await paypal.request('/v1/billing/subscriptions', 'POST', {
      plan_id: planId, custom_id: row._id, quantity: '1',
      application_context: {brand_name: 'Savage Master', user_action: 'SUBSCRIBE_NOW', shipping_preference: 'NO_SHIPPING',
        return_url: billingReturnUrl('approved'), cancel_url: billingReturnUrl('cancelled')},
    }, row.requestId);
    subscriptionPath(result.id);
    const approvalUrl = approvalLink(result);
    await ctx.runMutation(mutationRef('attachCheckout'), {id: row._id, subscriptionId: result.id, approvalUrl});
    return {approvalUrl};
  },
});
export const refresh = action({args: {}, handler: async ctx => {
  const row = await ctx.runQuery(queryRef('currentForOwner'), {ownerId: await owner(ctx)});
  if (!row?.subscriptionId) throw new Error('There is no PayPal subscription to refresh yet.');
  return synchronize(ctx, row);
}});
export const cancel = action({args: {}, handler: async ctx => {
  const row = await ctx.runQuery(queryRef('currentForOwner'), {ownerId: await owner(ctx)});
  if (!row?.subscriptionId) throw new Error('There is no PayPal subscription to cancel.');
  const paypal = new PayPalClient();
  const state = await synchronize(ctx, row, paypal);
  if (!['CANCELLED', 'EXPIRED'].includes(state.status)) {
    await paypal.request(subscriptionPath(row.subscriptionId) + '/cancel', 'POST', {reason: 'Account owner canceled through Savage Master.'});
  }
  await ctx.runMutation(mutationRef('markCancelled'), {id: row._id});
  return {paidThrough: state.paidThrough};
}});

const events = new Set(['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.UPDATED', 'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.COMPLETED', 'PAYMENT.SALE.REFUNDED', 'PAYMENT.SALE.REVERSED']);
export const webhook = httpAction(async (ctx, request) => {
  if (!process.env.PAYPAL_WEBHOOK_ID) return new Response('PayPal webhook is not configured.', {status: 503});
  const headers = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'];
  if (headers.some(h => !request.headers.get(h))) return new Response('Missing signature.', {status: 400});
  if (Number(request.headers.get('content-length') || 0) > 262144) return new Response('Event too large.', {status: 413});
  const raw = await request.text(); if (raw.length > 262144) return new Response('Event too large.', {status: 413});
  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response('Invalid event.', {status: 400}); }
  if (!event || typeof event.id !== 'string' || event.id.length > 100 || typeof event.event_type !== 'string') return new Response('Invalid event.', {status: 400});
  try {
    const paypal = new PayPalClient();
    const verification = await paypal.request('/v1/notifications/verify-webhook-signature', 'POST', {
      auth_algo: request.headers.get('paypal-auth-algo'), cert_url: request.headers.get('paypal-cert-url'),
      transmission_id: request.headers.get('paypal-transmission-id'), transmission_sig: request.headers.get('paypal-transmission-sig'),
      transmission_time: request.headers.get('paypal-transmission-time'), webhook_id: process.env.PAYPAL_WEBHOOK_ID, webhook_event: event,
    });
    if (verification.verification_status !== 'SUCCESS') return new Response('Invalid signature.', {status: 401});
    if (!events.has(event.event_type) || await ctx.runQuery(queryRef('seenEvent'), {eventId: event.id})) return new Response('OK');
    const resource = event.resource || {};
    let subscriptionId = event.event_type.startsWith('BILLING.SUBSCRIPTION.') ? resource.id : resource.billing_agreement_id;
    if (event.event_type === 'PAYMENT.SALE.REFUNDED' || event.event_type === 'PAYMENT.SALE.REVERSED') {
      const transactionId = event.event_type === 'PAYMENT.SALE.REFUNDED' ? resource.sale_id : resource.id;
      if (typeof transactionId !== 'string' || !/^[A-Z0-9]+$/.test(transactionId)) throw new Error('Invalid transaction.');
      const sale = await paypal.request('/v1/payments/sale/' + encodeURIComponent(transactionId));
      subscriptionId = sale.billing_agreement_id || subscriptionId;
      if (event.event_type === 'PAYMENT.SALE.REVERSED' || sale.state === 'refunded') {
        await ctx.runMutation(mutationRef('blockPayment'), {transactionId});
      }
    }
    if (typeof subscriptionId !== 'string' || !/^I-[A-Z0-9]+$/.test(subscriptionId)) {
      await ctx.runMutation(mutationRef('markEvent'), {eventId: event.id}); return new Response('OK');
    }
    let row = await ctx.runQuery(queryRef('findSubscription'), {subscriptionId});
    if (!row) {
      // Capture early notifications only for a checkout reserved by our server.
      const details = await paypal.request(subscriptionPath(subscriptionId));
      if (typeof details.custom_id === 'string') row = await ctx.runQuery(queryRef('findCheckout'), {customId: details.custom_id});
    }
    if (!row || row.environment !== environment()) {
      await ctx.runMutation(mutationRef('markEvent'), {eventId: event.id}); return new Response('OK');
    }
    await synchronize(ctx, {...row, subscriptionId}, paypal, event.id);
    return new Response('OK');
  } catch {
    // A non-2xx response asks PayPal to retry; never acknowledge an unprocessed payment.
    return new Response('Unable to verify this event. Please retry.', {status: 503});
  }
});
export const reconcile = internalAction({args: {cursor: v.optional(v.string())}, handler: async (ctx, {cursor}) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return;
  const page = await ctx.runQuery(queryRef('syncPage'), {cursor: cursor || null});
  const relevant = page.page.filter((r: Doc<'billingSubscriptions'>) => r.environment === environment() && r.subscriptionId &&
    (!['CANCELLED', 'EXPIRED'].includes(r.status) || (r.paidThrough || 0) > Date.now()));
  const results = await Promise.allSettled(relevant.map((row: Doc<'billingSubscriptions'>) => synchronize(ctx, row)));
  if (results.some(r => r.status === 'rejected')) console.error('Some PayPal subscriptions could not be reconciled; the next scheduled run will retry.');
  if (!page.isDone) await ctx.scheduler.runAfter(1000, ref<'action'>('paypal:reconcile'), {cursor: page.continueCursor});
}});
