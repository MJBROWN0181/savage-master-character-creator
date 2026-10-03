import {environment} from './billingModel';

export class PayPalClient {
  private base = environment() === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  private token?: string;
  async request(path: string, method = 'GET', body?: unknown, requestId?: string): Promise<any> {
    if (!this.token) {
      const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
      if (!id || !secret) throw new Error('PayPal is not connected yet.');
      const response = await fetch(this.base + '/v1/oauth2/token', {
        method: 'POST', headers: {Authorization: 'Basic ' + btoa(id + ':' + secret), 'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'grant_type=client_credentials', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('PayPal connection failed. Please try again later.');
      const result = await response.json(); this.token = result.access_token;
      if (!this.token) throw new Error('PayPal connection failed.');
    }
    const response = await fetch(this.base + path, {
      method, headers: {Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json',
        ...(requestId ? {'PayPal-Request-Id': requestId} : {}), Prefer: 'return=representation'},
      ...(body !== undefined ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(15000),
    });
    // Provider bodies can contain customer details; do not forward or log them.
    if (!response.ok) throw new Error(`PayPal could not complete this request (${response.status}). Please refresh your subscription or try again later.`);
    return response.status === 204 ? null : response.json();
  }
}
export function subscriptionPath(id: string) {
  if (!/^I-[A-Z0-9]+$/.test(id)) throw new Error('Invalid PayPal subscription.');
  return '/v1/billing/subscriptions/' + encodeURIComponent(id);
}
export function approvalLink(result: any) {
  const link = result.links?.find((l: any) => l.rel === 'approve')?.href;
  const url = new URL(link || 'about:blank');
  const hostname = environment() === 'live' ? 'www.paypal.com' : 'www.sandbox.paypal.com';
  if (url.protocol !== 'https:' || url.hostname !== hostname || url.username || url.password || url.port) throw new Error('PayPal did not provide a valid checkout link.');
  return url.href;
}
export function billingReturnUrl(outcome: 'approved' | 'cancelled') {
  const url = new URL(process.env.SITE_URL || '');
  if (url.username || url.password || (url.protocol !== 'https:' && !(environment() === 'sandbox' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('Site address is not configured for PayPal.');
  return new URL('/pricing?checkout=' + outcome, url.origin).href;
}
