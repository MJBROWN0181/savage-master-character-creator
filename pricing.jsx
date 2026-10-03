import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ConvexReactClient, useAction, useConvexAuth, useQuery} from 'convex/react';
import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {makeFunctionReference as ref} from 'convex/server';
import {CharacterAccount} from './account.jsx';
import './pricing.css';

function Introduction() {
  return <><section className="price-hero"><span className="price-label">Your character. Your table. Your story.</span><h1>Your account, ready for the next chapter.</h1><p>Keep building and playing while Savage Master’s new features take shape.</p></section><p className="price-notice" role="status">PayPal billing is being prepared. Paid packages and checkout will open after the features are ready. There is nothing to purchase here yet.</p></>;
}
function Billing() {
  const {isAuthenticated,isLoading}=useConvexAuth();
  const summary=useQuery(ref('billing:summary'),{});
  const refresh=useAction(ref('paypal:refresh')),cancel=useAction(ref('paypal:cancel'));
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function run(action) {setBusy(true);setMessage('');try {await action();} catch(error){setMessage(error.message||'This request could not be completed. Please try again.');} finally{setBusy(false);}}
  useEffect(()=>{
    const outcome=new URLSearchParams(location.search).get('checkout');
    if(outcome==='cancelled')setMessage('PayPal checkout was closed. Refresh an existing subscription to check its status.');
    if(outcome==='approved'&&isAuthenticated)run(async()=>{await refresh({});setMessage('Subscription checked with PayPal.');});
    if(outcome&&isAuthenticated)history.replaceState({},'',location.pathname);
  },[isAuthenticated]);
  const subscription=summary?.subscription;
  return <main className="pricing-page"><nav className="price-nav" aria-label="Workspace"><a className="price-brand" href="/">Savage Master</a><a href="/?game=savage">Characters</a><a href="/campaigns">Campaigns</a><a href="/builder">Master Builder</a><a href="/profile">My Profile</a></nav><Introduction/>
    <section id="your-account" className="price-account"><h2>Your account</h2><CharacterAccount accountOnly/>
      {isLoading?<p>Checking your account…</p>:isAuthenticated&&summary&&<>
        <h3>PayPal billing</h3><p>{summary.credentialsConfigured?'PayPal account configuration is in place.':'PayPal account configuration is pending.'} {summary.webhookConfigured?'Payment notification configuration is in place.':'Payment notification configuration is pending.'}</p>
        <p>Packages are on hold while features are being built. Your character, world and campaign tools continue to work.</p>
        {summary.environment==='sandbox'&&<p>Billing environment: sandbox. This environment uses test transactions.</p>}
        {subscription&&<div className="price-subscription"><p>PayPal status: {subscription.status.replaceAll('_',' ').toLowerCase()}</p>
          {subscription.paidThrough>Date.now()&&<p>Verified paid period ends {new Date(subscription.paidThrough).toLocaleString()}.</p>}
          {subscription.hasSubscription&&<button className="price-button price-secondary" disabled={busy} onClick={()=>run(async()=>{await refresh({});setMessage('Subscription refreshed from PayPal.');})}>Refresh subscription</button>}
          {subscription.hasSubscription&&!['CANCELLED','EXPIRED'].includes(subscription.status)&&<details><summary>Cancel subscription</summary><p>Stop future renewals. Existing saved content stays available.</p><button className="price-button price-secondary" disabled={busy} onClick={()=>run(async()=>{await cancel({});setMessage('Subscription canceled. PayPal will not renew it.');})}>Confirm cancellation</button></details>}
          {subscription.syncedAt>0&&<small>Last checked {new Date(subscription.syncedAt).toLocaleString()}.</small>}
        </div>}
      </>}
      <p className="price-status" role="status" aria-live="polite">{busy?'Checking with PayPal…':message}</p>
    </section><footer>Created by Visionary Studios 101 · Savage Master</footer></main>;
}
function UnavailableBilling(){return <main className="pricing-page"><nav className="price-nav"><a href="/">Savage Master</a></nav><Introduction/><section className="price-account"><h2>Your account</h2><p>Account services are temporarily unavailable. Please try again later.</p></section></main>;}
class AccountBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<UnavailableBilling/>:this.props.children;}
}
const url=import.meta.env.VITE_CONVEX_URL;
createRoot(document.getElementById('pricingRoot')).render(<AccountBoundary>{url?<ConvexAuthProvider client={new ConvexReactClient(url)}><Billing/></ConvexAuthProvider>:<UnavailableBilling/>}</AccountBoundary>);
