// Run with node --env-file=.env.paypal.local scripts/setup-paypal.mjs
// This creates merchant catalog/plans/webhook configuration, never a buyer charge.
const environment=process.env.PAYPAL_ENVIRONMENT||'sandbox';
if(!['sandbox','live'].includes(environment))throw new Error('PAYPAL_ENVIRONMENT must be sandbox or live.');
if(environment==='live'&&process.env.PAYPAL_LIVE_READY!=='true')throw new Error('Complete sandbox testing and release readiness before configuring live billing.');
const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;
if(!id||!secret)throw new Error('Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in an ignored environment file.');
const webhookUrl=new URL(process.env.PAYPAL_WEBHOOK_URL||'');
if(webhookUrl.protocol!=='https:'||webhookUrl.username||webhookUrl.password||webhookUrl.pathname!=='/paypal/webhook')throw new Error('Use the HTTPS Convex HTTP-action URL ending in /paypal/webhook.');
const base=environment==='sandbox'?'https://api-m.sandbox.paypal.com':'https://api-m.paypal.com';
const auth=await fetch(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
if(!auth.ok)throw new Error('PayPal authentication failed. Check the selected environment and app credentials.');
const {access_token:token}=await auth.json();if(!token)throw new Error('PayPal did not return an access token.');
async function request(path,body,requestId){
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation',...(requestId?{'PayPal-Request-Id':requestId}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('PayPal setup request failed ('+response.status+'). No customer data or credentials were printed.');
  return response.json();
}
// Stable request IDs help short retries; operators should retain printed IDs for later reuse.
const product=process.env.PAYPAL_PRODUCT_ID?{id:process.env.PAYPAL_PRODUCT_ID}:await request('/v1/catalogs/products',{name:'Savage Master',description:'Character, world and campaign account tools',type:'SERVICE',category:'SOFTWARE'},'sm-'+environment+'-product-v1');
const plans={};
// Package creation is deliberately opt-in while product features are being built.
for(const [tier,value] of (process.argv.includes('--create-plans')?[['CHRONICLE','4.99'],['STORYKEEPER','9.99']]:[])){
  const existing=process.env['PAYPAL_'+tier+'_PLAN_ID'];
  const plan=existing?await request('/v1/billing/plans/'+encodeURIComponent(existing)):await request('/v1/billing/plans',{
    product_id:product.id,name:(tier==='CHRONICLE'?'Chronicle':'Storykeeper')+' Monthly',description:'Savage Master '+tier.toLowerCase()+' account — USD '+value+' per month',status:'ACTIVE',
    billing_cycles:[{frequency:{interval_unit:'MONTH',interval_count:1},tenure_type:'REGULAR',sequence:1,total_cycles:0,pricing_scheme:{fixed_price:{value,currency_code:'USD'}}}],
    payment_preferences:{auto_bill_outstanding:false,payment_failure_threshold:1},
  },'sm-'+environment+'-'+tier.toLowerCase()+'-v1');
  const cycle=plan.billing_cycles?.[0];
  if(plan.status!=='ACTIVE'||plan.billing_cycles?.length!==1||cycle?.tenure_type!=='REGULAR'||cycle?.frequency?.interval_unit!=='MONTH'||cycle?.frequency?.interval_count!==1||cycle?.total_cycles!==0||cycle?.pricing_scheme?.fixed_price?.currency_code!=='USD'||Number(cycle?.pricing_scheme?.fixed_price?.value)!==Number(value)||Number(plan.payment_preferences?.setup_fee?.value||0)!==0||Number(plan.taxes?.percentage||0)!==0)throw new Error('Existing plan does not match the advertised monthly price.');
  plans[tier]=plan.id;
}
const eventTypes=['BILLING.SUBSCRIPTION.ACTIVATED','BILLING.SUBSCRIPTION.UPDATED','BILLING.SUBSCRIPTION.CANCELLED','BILLING.SUBSCRIPTION.SUSPENDED','BILLING.SUBSCRIPTION.EXPIRED','BILLING.SUBSCRIPTION.PAYMENT.FAILED','PAYMENT.SALE.COMPLETED','PAYMENT.SALE.REFUNDED','PAYMENT.SALE.REVERSED'];
const listed=await request('/v1/notifications/webhooks');
let webhook=listed.webhooks?.find(w=>w.url===webhookUrl.href);
if(!webhook)webhook=await request('/v1/notifications/webhooks',{url:webhookUrl.href,event_types:eventTypes.map(name=>({name}))});
else if(!webhook.event_types?.some(e=>e.name==='*')&&eventTypes.some(name=>!webhook.event_types?.some(e=>e.name===name)))throw new Error('Existing webhook is missing required events. Update its event selection in PayPal.');
console.log('PayPal '+environment+' configuration created. These IDs are not credentials.');
console.log('PAYPAL_PRODUCT_ID='+product.id);
if(plans.CHRONICLE)console.log('PAYPAL_CHRONICLE_PLAN_ID='+plans.CHRONICLE);
if(plans.STORYKEEPER)console.log('PAYPAL_STORYKEEPER_PLAN_ID='+plans.STORYKEEPER);
console.log('PAYPAL_WEBHOOK_ID='+webhook.id);
console.log('Packages are deferred. Keep checkout disabled until features and sandbox end-to-end tests are ready.');
