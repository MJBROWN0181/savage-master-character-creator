import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const scriptUrl=new URL('../scripts/setup-paypal.mjs',import.meta.url).href;
test('PayPal setup creates the merchant integration without creating packages or buyer subscriptions',()=>{
  const program=`
    const calls=[];
    globalThis.fetch=async(url,init)=>{
      calls.push(String(url));
      if(String(url).endsWith('/v1/oauth2/token'))return Response.json({access_token:'test-only-token'});
      if(String(url).endsWith('/v1/catalogs/products'))return Response.json({id:'PROD-TEST'});
      if(String(url).endsWith('/v1/notifications/webhooks'))return Response.json(init.method==='POST'?{id:'TESTHOOK'}:{webhooks:[]});
      throw new Error('Setup attempted an unexpected external operation');
    };
    await import(${JSON.stringify(scriptUrl)});
    if(calls.some(url=>url.includes('/billing/')))throw new Error('Packages were created during setup');
    console.log('TEST_REQUESTS='+calls.length);
  `;
  const output=execFileSync(process.execPath,['--input-type=module','-e',program],{encoding:'utf8',env:{...process.env,PAYPAL_ENVIRONMENT:'sandbox',PAYPAL_CLIENT_ID:'test-only-client',PAYPAL_CLIENT_SECRET:'test-only-secret',PAYPAL_WEBHOOK_URL:'https://setup-test.convex.site/paypal/webhook',PAYPAL_PRODUCT_ID:'',PAYPAL_CHRONICLE_PLAN_ID:'',PAYPAL_STORYKEEPER_PLAN_ID:''}});
  assert.match(output,/PAYPAL_PRODUCT_ID=PROD-TEST/);assert.match(output,/PAYPAL_WEBHOOK_ID=TESTHOOK/);assert.match(output,/TEST_REQUESTS=4/);
  assert.doesNotMatch(output,/PAYPAL_CHRONICLE_PLAN_ID|PAYPAL_STORYKEEPER_PLAN_ID|test-only-secret|test-only-token/);
});
