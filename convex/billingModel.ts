export type PaidTier = 'chronicle' | 'storykeeper';
export type Tier = 'free' | PaidTier;
export const PLANS = {
  free: {name: 'Adventurer', price: '0.00'},
  chronicle: {name: 'Chronicle', price: '4.99'},
  storykeeper: {name: 'Storykeeper', price: '9.99'},
} as const;

export function environment(): 'sandbox' | 'live' {
  const value = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  if (value !== 'sandbox' && value !== 'live') throw new Error('PayPal environment is not configured correctly.');
  return value;
}
export function checkoutReady() {
  try {
    const env = environment();
    return process.env.PAYPAL_PACKAGES_READY === 'true' && process.env.PAYPAL_CHECKOUT_ENABLED === 'true' &&
      (env === 'sandbox' || process.env.PAYPAL_LIVE_READY === 'true') &&
      !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET &&
      !!process.env.PAYPAL_WEBHOOK_ID && !!process.env.PAYPAL_CHRONICLE_PLAN_ID &&
      !!process.env.PAYPAL_STORYKEEPER_PLAN_ID && !!process.env.SITE_URL;
  } catch { return false; }
}
export function configuredPlan(tier: PaidTier) {
  const value = process.env[tier === 'chronicle' ? 'PAYPAL_CHRONICLE_PLAN_ID' : 'PAYPAL_STORYKEEPER_PLAN_ID'];
  if (!value || !/^P-[A-Z0-9]+$/.test(value)) throw new Error('This PayPal plan is not configured yet.');
  return value;
}
export function accessTier(rows: Array<{tier: PaidTier; environment: string; paidThrough?: number}>, now = Date.now()): Tier {
  const paid = rows.filter(r => r.environment === environment() && (r.paidThrough || 0) > now);
  return paid.some(r => r.tier === 'storykeeper') ? 'storykeeper' : paid.length ? 'chronicle' : 'free';
}
export function monthlyEnd(timestamp: number) {
  const date = new Date(timestamp), day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay)); return date.getTime();
}
export function assertMonthlyPlan(plan: any, tier: PaidTier) {
  const cycles = plan?.billing_cycles;
  const cycle = cycles?.[0];
  if (plan?.status !== 'ACTIVE' || !Array.isArray(cycles) || cycles.length !== 1 ||
    cycle.tenure_type !== 'REGULAR' || cycle.frequency?.interval_unit !== 'MONTH' ||
    cycle.frequency?.interval_count !== 1 || cycle.total_cycles !== 0 ||
    cycle.pricing_scheme?.fixed_price?.currency_code !== 'USD' ||
    Number(cycle.pricing_scheme.fixed_price.value) !== Number(PLANS[tier].price) ||
    Number(plan.payment_preferences?.setup_fee?.value || 0) !== 0 ||
    Number(plan.taxes?.percentage || 0) !== 0) {
    throw new Error('PayPal plan must match the advertised monthly USD price, without trials or additional charges.');
  }
}
// Access comes from settled transactions, never the browser return URL or ACTIVE alone.
export function verifiedState(subscription: any, transactions: any[], row: {subscriptionId?: string; _id: string; planId: string; tier: PaidTier; paymentId?: string; paidThrough?: number}, now: number) {
  if (subscription?.id !== row.subscriptionId || subscription.custom_id !== row._id ||
    subscription.plan_id !== row.planId || subscription.plan_overridden === true ||
    (subscription.quantity && Number(subscription.quantity) !== 1)) throw new Error('PayPal subscription does not match this account.');
  const status = subscription.status;
  if (!['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(status)) throw new Error('Unexpected PayPal subscription status.');
  const valid = transactions.filter(tx => {
    const amount = tx?.amount_with_breakdown?.gross_amount;
    const timestamp = Date.parse(tx.time);
    return typeof tx.id === 'string' && ['COMPLETED', 'PARTIALLY_REFUNDED'].includes(tx.status) &&
      amount?.currency_code === 'USD' && Number(amount.value) === Number(PLANS[row.tier].price) &&
      Number.isFinite(timestamp) && timestamp <= now && timestamp + 35 * 86400000 > now;
  }).sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const payment = valid[0];
  let paidThrough = payment ? monthlyEnd(Date.parse(payment.time)) : 0;
  if (payment) {
    const paidAt = Date.parse(payment.time), next = Date.parse(subscription.billing_info?.next_billing_time);
    // PayPal may retain the original 29th–31st billing day across shorter months.
    if (Number.isFinite(next) && next > paidAt && next <= paidAt + 35 * 86400000) paidThrough = next;
    // Cancellation may remove next_billing_time; preserve the already verified end.
    if (row.paymentId === payment.id && row.paidThrough && row.paidThrough > paidThrough && row.paidThrough <= paidAt + 35 * 86400000) paidThrough = row.paidThrough;
  }
  return {status, paidThrough, paymentId: payment?.id};
}
