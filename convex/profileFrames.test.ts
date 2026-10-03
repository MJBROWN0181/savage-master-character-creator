import { convexTest } from 'convex-test';
import { test, expect, vi, afterEach } from 'vitest';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
import { awardVerifiedMember, awardLiveSupporter } from './profileFrames';
const modules = import.meta.glob('./**/*.ts');
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

test('first 100 verified members receive permanent unique awards, existing accounts initialize in signup order', async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const users = [];
    for (let i = 0; i < 102; i++) users.push(await ctx.db.insert('users', { email: `member${i}@example.test`, ...(i === 0 ? {} : { emailVerificationTime: Date.now() }) }));
    return users;
  });
  await t.run(ctx => awardVerifiedMember(ctx, ids[0]));
  expect(await t.run(ctx => ctx.db.query('profileFrameAwards').collect())).toEqual([]);
  await t.run(ctx => awardVerifiedMember(ctx, ids[101]));
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  const awards = await t.run(ctx => ctx.db.query('profileFrameAwards').withIndex('by_kind_number', q => q.eq('kind', 'founding-100')).collect());
  expect(awards).toHaveLength(100); expect(awards[0].ownerId).toBe(ids[1]); expect(awards[99].ownerId).toBe(ids[100]);
  await t.run(ctx => awardVerifiedMember(ctx, ids[1]));
  await t.run(ctx => ctx.db.delete(ids[1]));
  const late = await t.run(ctx => ctx.db.insert('users', { email: 'late@example.test', emailVerificationTime: Date.now() }));
  await t.run(ctx => awardVerifiedMember(ctx, late));
  expect((await t.withIdentity({ subject: late }).query(ref<'query'>('profileFrames:mine'), {}) as any).available).not.toContain('founding-100');
  expect(await t.run(ctx => ctx.db.query('profileFrameAwards').collect())).toHaveLength(100);
});

test('only 50 distinct paying members receive supporter awards; renewals do not consume another slot', async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const users = []; for (let i = 0; i < 51; i++) users.push(await ctx.db.insert('users', {})); return users;
  });
  for (let i = 0; i < ids.length; i++) await t.run(ctx => awardLiveSupporter(ctx, ids[i], `PAYMENT${i}`));
  await t.run(ctx => awardLiveSupporter(ctx, ids[0], 'RENEWAL'));
  const awards = await t.run(ctx => ctx.db.query('profileFrameAwards').collect());
  expect(awards).toHaveLength(50); expect(new Set(awards.map(a => a.number)).size).toBe(50);
  expect(awards.some(a => a.ownerId === ids[50])).toBe(false);
});

test('billing awards only confirmed current live payments; sandbox, unpaid, blocked and stale states do not count', async () => {
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', {}));
  const apply = ref<'mutation'>('billing:applyState');
  const row = async (environment: 'live' | 'sandbox', requestId: string) => t.run(ctx => ctx.db.insert('billingSubscriptions', { ownerId, tier: 'chronicle', environment, planId: 'P-TEST', requestId, status: 'APPROVAL_PENDING', createdAt: Date.now() }));
  vi.stubEnv('PAYPAL_ENVIRONMENT', 'sandbox');
  const sandbox = await row('sandbox', 'sandbox');
  const state = { subscriptionId: 'I-TEST', status: 'ACTIVE', paidThrough: Date.now() + 86400000, paymentId: 'SALE1', syncStartedAt: Date.now() };
  await t.mutation(apply, { id: sandbox, ...state });
  expect(await t.run(ctx => ctx.db.query('profileFrameAwards').collect())).toEqual([]);
  vi.stubEnv('PAYPAL_ENVIRONMENT', 'live');
  const live = await row('live', 'live');
  await t.mutation(apply, { id: live, ...state, paidThrough: 0, paymentId: undefined });
  await t.mutation(apply, { id: live, ...state, paymentId: 'BLOCKED', blockTransactionId: 'BLOCKED' });
  await t.mutation(apply, { id: live, ...state, syncStartedAt: state.syncStartedAt - 1000 });
  expect(await t.run(ctx => ctx.db.query('profileFrameAwards').collect())).toEqual([]);
  await t.mutation(apply, { id: live, ...state, syncStartedAt: state.syncStartedAt + 1000 });
  expect(await t.run(ctx => ctx.db.query('profileFrameAwards').collect())).toHaveLength(1);
});

test('earned frames default on, can be hidden and selected, and cannot be forged into an admin badge', async () => {
  vi.stubEnv('PROFILE_MODERATOR_ADMIN_EMAILS', 'admin@example.test');
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', { email: 'player@example.test', emailVerificationTime: Date.now() }));
  const owner = t.withIdentity({ subject: ownerId }), mine = ref<'query'>('profileFrames:mine'), pref = ref<'mutation'>('profileFrames:setPreference');
  await t.run(ctx => awardLiveSupporter(ctx, ownerId, 'SALE'));
  expect(await owner.query(mine, {})).toMatchObject({ active: 'founding-50-supporters', enabled: true });
  await expect(owner.mutation(pref, { enabled: true, selection: 'admin' })).rejects.toThrow('earned');
  await expect(t.mutation(pref, { enabled: false, selection: 'auto' })).rejects.toThrow('Sign in');
  await owner.mutation(pref, { enabled: false, selection: 'founding-50-supporters' });
  expect(await owner.query(mine, {})).toMatchObject({ active: null, available: ['founding-50-supporters'] });
  await owner.mutation(pref, { enabled: true, selection: 'auto' });
  expect(await owner.query(mine, {})).toMatchObject({ active: 'founding-50-supporters' });
  await t.run(ctx => ctx.db.patch(ownerId, { email: 'admin@example.test' }));
  await owner.mutation(pref, { enabled: true, selection: 'admin' });
  expect(await owner.query(mine, {})).toMatchObject({ active: 'admin' });
  vi.stubEnv('PROFILE_MODERATOR_ADMIN_EMAILS', 'other@example.test');
  expect(await owner.query(mine, {})).toMatchObject({ active: 'founding-50-supporters', selection: 'auto' });
});
