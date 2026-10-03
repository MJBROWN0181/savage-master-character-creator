import {convexTest} from 'convex-test';
import {afterEach, expect, test, vi} from 'vitest';
import {makeFunctionReference as ref} from 'convex/server';
import schema from './schema';
import {accessTier, assertMonthlyPlan, monthlyEnd, verifiedState} from './billingModel';

const modules=import.meta.glob('./**/*.ts');
const q=(n:string)=>ref<'query'>('billing:'+n),m=(n:string)=>ref<'mutation'>('billing:'+n),a=(n:string)=>ref<'action'>('paypal:'+n);
const now=Date.parse('2026-10-02T12:00:00Z'),planId='P-TESTCHRONICLE',subscriptionId='I-TESTSUBSCRIPTION';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.useRealTimers();});
function configure() {
  vi.stubEnv('PAYPAL_ENVIRONMENT','sandbox');vi.stubEnv('PAYPAL_CLIENT_ID','test-client');vi.stubEnv('PAYPAL_CLIENT_SECRET','test-secret');
  vi.stubEnv('PAYPAL_WEBHOOK_ID','TESTHOOK');vi.stubEnv('PAYPAL_CHRONICLE_PLAN_ID',planId);vi.stubEnv('PAYPAL_STORYKEEPER_PLAN_ID','P-TESTSTORYKEEPER');
  vi.stubEnv('PAYPAL_PACKAGES_READY','true');vi.stubEnv('PAYPAL_CHECKOUT_ENABLED','true');vi.stubEnv('SITE_URL','http://localhost:5173');
}
function plan(price='4.99') {return {status:'ACTIVE',billing_cycles:[{tenure_type:'REGULAR',total_cycles:0,frequency:{interval_unit:'MONTH',interval_count:1},pricing_scheme:{fixed_price:{currency_code:'USD',value:price}}}]};}
function transaction(id='SALE1',time='2026-10-01T12:00:00Z',status='COMPLETED') {return {id,time,status,amount_with_breakdown:{gross_amount:{currency_code:'USD',value:'4.99'}}};}
async function setup() {
  const t=convexTest(schema,modules),ownerId=await t.run(ctx=>ctx.db.insert('users',{})),otherId=await t.run(ctx=>ctx.db.insert('users',{}));
  const owner=t.withIdentity({subject:ownerId}),other=t.withIdentity({subject:otherId});
  return {t,owner,other,ownerId};
}
async function checkoutRow(t:any,ownerId:any,tier='chronicle') {
  return t.mutation(m('reserveCheckout'),{ownerId,tier,planId,requestId:'test-request-id'});
}
function mockPayPal(row:any,options:{status?:string;transactions?:any[];verified?:boolean;fail?:boolean}={}) {
  const fn=vi.fn(async (input:any,init:any)=>{
    const url=String(input),body=init?.body?JSON.parse(init.body==='grant_type=client_credentials'?'{}':init.body):null;
    if(options.fail&&url.endsWith('/transactions?'))throw new Error('network failed');
    if(url.endsWith('/v1/oauth2/token'))return Response.json({access_token:'test-token'});
    if(url.includes('/verify-webhook-signature'))return Response.json({verification_status:options.verified===false?'FAILURE':'SUCCESS'});
    if(url.includes('/v1/billing/plans/'))return Response.json(plan());
    if(url.endsWith('/v1/billing/subscriptions')&&init?.method==='POST')return Response.json({id:subscriptionId,links:[{rel:'approve',href:'https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=TEST'}],custom_id:body.custom_id});
    if(url.includes('/transactions?'))return options.fail?new Response('error',{status:500}):Response.json({transactions:options.transactions??[transaction()],total_pages:1});
    if(url.endsWith('/cancel'))return new Response(null,{status:204});
    if(url.includes('/v1/payments/sale/'))return Response.json({state:'refunded',billing_agreement_id:subscriptionId});
    if(url.endsWith('/'+subscriptionId))return Response.json({id:subscriptionId,custom_id:row._id,plan_id:planId,status:options.status??'ACTIVE'});
    throw new Error('Unexpected test URL: '+url);
  });vi.stubGlobal('fetch',fn);return fn;
}
function webhookRequest(event:any,signature=true): RequestInit {
  return {method:'POST',headers:signature?{'paypal-auth-algo':'SHA256withRSA','paypal-cert-url':'https://api.sandbox.paypal.com/cert','paypal-transmission-id':'T1','paypal-transmission-sig':'test','paypal-transmission-time':'2026-10-02T12:00:00Z'}:{},body:JSON.stringify(event)};
}

test('payment validation rejects account/plan tampering, unpaid activation and invalid price or currency',()=>{
  const row={_id:'local-checkout',planId,tier:'chronicle' as const,subscriptionId};
  const sub={id:subscriptionId,custom_id:row._id,plan_id:planId,status:'ACTIVE'};
  expect(verifiedState(sub,[],row,now).paidThrough).toBe(0);
  expect(()=>verifiedState({...sub,custom_id:'someone-else'},[transaction()],row,now)).toThrow('match this account');
  expect(()=>verifiedState({...sub,plan_id:'P-OTHER'},[transaction()],row,now)).toThrow('match this account');
  expect(()=>verifiedState({...sub,plan_overridden:true},[transaction()],row,now)).toThrow('match this account');
  for(const tx of [transaction('PENDING',undefined,'PENDING'),transaction('REFUNDED',undefined,'REFUNDED'),{...transaction(),amount_with_breakdown:{gross_amount:{currency_code:'EUR',value:'4.99'}}},{...transaction(),amount_with_breakdown:{gross_amount:{currency_code:'USD',value:'0.01'}}},transaction('FUTURE','2027-01-01T00:00:00Z')]) expect(verifiedState(sub,[tx],row,now).paidThrough).toBe(0);
  expect(verifiedState(sub,[transaction()],row,now).paidThrough).toBe(Date.parse('2026-11-01T12:00:00Z'));
  expect(()=>assertMonthlyPlan(plan('0.99'),'chronicle')).toThrow('advertised');
  expect(()=>assertMonthlyPlan({...plan(),taxes:{percentage:'10'}},'chronicle')).toThrow('advertised');
});
test('month-end payments and cancellation retain the verified billing boundary',()=>{
  expect(monthlyEnd(Date.parse('2027-01-31T12:00:00Z'))).toBe(Date.parse('2027-02-28T12:00:00Z'));
  const row={_id:'local-checkout',planId,tier:'chronicle' as const,subscriptionId,paymentId:'SALE1',paidThrough:Date.parse('2027-03-31T12:00:00Z')};
  const sub={id:subscriptionId,custom_id:row._id,plan_id:planId,status:'CANCELLED'};
  expect(verifiedState(sub,[transaction('SALE1','2027-02-28T12:00:00Z')],row,Date.parse('2027-03-01T00:00:00Z')).paidThrough).toBe(row.paidThrough);
  expect(verifiedState(sub,[transaction('SALE1','2027-02-28T12:00:00Z')],row,Date.parse('2027-03-30T00:00:00Z')).paidThrough).toBe(row.paidThrough);
});
test('checkout reserves one account slot, repeats the same request ID and fails closed when unavailable',async()=>{
  configure();const {t,owner,other,ownerId}=await setup();
  const [first,second]=await Promise.all([checkoutRow(t,ownerId),checkoutRow(t,ownerId)]);expect(first._id).toBe(second._id);expect(first.requestId).toBe(second.requestId);
  const fetch=mockPayPal(first);
  const result=await owner.action(a('startCheckout'),{tier:'chronicle'});expect(result.approvalUrl).toContain('www.sandbox.paypal.com');
  await owner.action(a('startCheckout'),{tier:'chronicle'});
  const posts=fetch.mock.calls.filter(([url,init]:any)=>String(url).endsWith('/v1/billing/subscriptions')&&init?.method==='POST');
  expect(posts).toHaveLength(1);expect(JSON.parse(posts[0][1].body).custom_id).toBe(first._id);expect(posts[0][1].headers['PayPal-Request-Id']).toBe(first.requestId);
  expect((await other.query(q('summary'),{})).subscription).toBeNull();await expect(other.action(a('refresh'),{})).rejects.toThrow('no PayPal');
  await expect(t.action(a('startCheckout'),{tier:'chronicle'})).rejects.toThrow('Sign in');
  vi.stubEnv('PAYPAL_CHECKOUT_ENABLED','false');await expect(owner.action(a('startCheckout'),{tier:'chronicle'})).rejects.toThrow('not available');
  vi.stubEnv('PAYPAL_CHECKOUT_ENABLED','true');vi.stubEnv('PAYPAL_ENVIRONMENT','live');vi.stubEnv('PAYPAL_LIVE_READY','false');expect((await owner.query(q('summary'),{})).checkoutReady).toBe(false);
});
test('package hold prevents checkout even after PayPal credentials are configured',async()=>{
  configure();vi.stubEnv('PAYPAL_PACKAGES_READY','false');const {owner}=await setup();
  expect((await owner.query(q('summary'),{})).checkoutReady).toBe(false);
  await expect(owner.action(a('startCheckout'),{tier:'chronicle'})).rejects.toThrow('not available');
});
test('verified payment unlocks an account, cancel preserves paid days, expiry restores Free without deleting records',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);configure();const {t,owner,ownerId}=await setup(),row=await checkoutRow(t,ownerId);
  await t.mutation(m('attachCheckout'),{id:row._id,subscriptionId,approvalUrl:'https://www.sandbox.paypal.com/test'});const fetch=mockPayPal(row);
  await owner.action(a('refresh'),{});expect((await owner.query(q('summary'),{})).tier).toBe('chronicle');
  await owner.action(a('cancel'),{});expect(fetch.mock.calls.some(([url]:any)=>String(url).endsWith('/cancel'))).toBe(true);
  expect((await owner.query(q('summary'),{})).subscription.status).toBe('CANCELLED');expect((await owner.query(q('summary'),{})).tier).toBe('chronicle');
  await expect(owner.action(a('startCheckout'),{tier:'storykeeper'})).rejects.toThrow('advertised');
  vi.setSystemTime(Date.parse('2026-11-02T12:00:00Z'));expect((await owner.query(q('summary'),{})).tier).toBe('free');
  expect(await t.run(ctx=>ctx.db.query('billingSubscriptions').collect())).toHaveLength(1);
});
test('webhooks verify signatures, deduplicate events and retry failed payment lookups',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);configure();const {t,owner,ownerId}=await setup(),row=await checkoutRow(t,ownerId);
  await t.mutation(m('attachCheckout'),{id:row._id,subscriptionId,approvalUrl:'https://www.sandbox.paypal.com/test'});
  const event={id:'WH-1',event_type:'PAYMENT.SALE.COMPLETED',resource:{id:'SALE1',billing_agreement_id:subscriptionId}};
  expect((await t.fetch('/paypal/webhook',webhookRequest(event,false))).status).toBe(400);
  mockPayPal(row,{verified:false});expect((await t.fetch('/paypal/webhook',webhookRequest(event))).status).toBe(401);expect((await owner.query(q('summary'),{})).tier).toBe('free');
  mockPayPal(row,{fail:true});expect((await t.fetch('/paypal/webhook',webhookRequest(event))).status).toBe(503);expect(await t.query(q('seenEvent'),{eventId:event.id})).toBe(false);
  mockPayPal(row);expect((await t.fetch('/paypal/webhook',webhookRequest(event))).status).toBe(200);expect((await owner.query(q('summary'),{})).tier).toBe('chronicle');
  expect((await t.fetch('/paypal/webhook',webhookRequest(event))).status).toBe(200);expect(await t.run(ctx=>ctx.db.query('billingEvents').collect())).toHaveLength(1);
});
test('refund cannot be overwritten by a later stale completed response; old events cannot replace newer state',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);configure();const {t,owner,ownerId}=await setup(),row=await checkoutRow(t,ownerId);
  await t.mutation(m('attachCheckout'),{id:row._id,subscriptionId,approvalUrl:'https://www.sandbox.paypal.com/test'});mockPayPal(row);await owner.action(a('refresh'),{});
  const event={id:'WH-REFUND',event_type:'PAYMENT.SALE.REFUNDED',resource:{sale_id:'SALE1'}};
  expect((await t.fetch('/paypal/webhook',webhookRequest(event))).status).toBe(200);expect((await owner.query(q('summary'),{})).tier).toBe('free');
  await owner.action(a('refresh'),{});expect((await owner.query(q('summary'),{})).tier).toBe('free');
  await t.mutation(m('applyState'),{id:row._id,subscriptionId,status:'ACTIVE',paidThrough:now+86400000,paymentId:'SALE2',syncStartedAt:now+1});
  await t.mutation(m('applyState'),{id:row._id,subscriptionId,status:'SUSPENDED',paidThrough:0,syncStartedAt:now-1});
  expect((await owner.query(q('summary'),{})).tier).toBe('chronicle');
});
test('sandbox paid subscriptions never grant live access',()=>{
  vi.stubEnv('PAYPAL_ENVIRONMENT','live');expect(accessTier([{tier:'storykeeper',environment:'sandbox',paidThrough:now+1000}],now)).toBe('free');
});
