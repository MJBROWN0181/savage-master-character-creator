import { afterEach, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
import { TERMS_VERSION } from '../legal-terms.mjs';

const modules = import.meta.glob('./**/*.ts');
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

test('real signup and reset providers send eight-digit codes to the requested mailbox', async () => {
  vi.stubEnv('AUTH_RESEND_KEY', 're_test_account_email_key');
  vi.stubEnv('AUTH_EMAIL_FROM', 'Savage Master <noreply@example.invalid>');
  vi.stubEnv('SITE_URL', 'https://example.invalid');
  const requests: { headers: Headers; body: Record<string, unknown> }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: unknown, init: RequestInit) => {
    requests.push({ headers: new Headers(init.headers), body: JSON.parse(init.body as string) });
    return new Response(JSON.stringify({ id: 'synthetic-email' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  const t = convexTest(schema, modules);
  const email = 'account-email-test@example.invalid';
  const invoke = (flow: string) => t.action(ref<'action'>('auth:signIn'), { provider: 'password', params: { flow, email, password: 'synthetic-password-123', acceptedTerms: TERMS_VERSION } });
  await invoke('signUp');
  await invoke('reset');
  expect(requests).toHaveLength(2);
  for (const request of requests) {
    expect(request.headers.get('Authorization')).toBe('Bearer re_test_account_email_key');
    expect(request.body.from).toBe('Savage Master <noreply@example.invalid>');
    expect(request.body.to).toEqual([email]);
    expect(request.body.text).toMatch(/Your Savage Master code is \d{8}\./);
  }
  expect(requests.map(request => request.body.subject)).toEqual(['Verify your Savage Master email', 'Savage Master password reset']);
});

test('provider failures record safe diagnostics without recording recipients, codes, or keys', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('AUTH_RESEND_KEY', 're_private_test_key');
  vi.stubEnv('AUTH_EMAIL_FROM', 'Savage Master <noreply@example.invalid>');
  vi.stubEnv('SITE_URL', 'https://example.invalid');
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ name: 'validation_error', statusCode: 403, message: 'Private recipient account-email-test@example.invalid with re_private_test_key and code 12345678' }), { status: 403 })));
  const t = convexTest(schema, modules);
  await expect(t.action(ref<'action'>('auth:signIn'), { provider: 'password', params: { flow: 'signUp', email: 'account-email-test@example.invalid', password: 'synthetic-password-123', acceptedTerms: TERMS_VERSION } })).rejects.toMatchObject({ data: { code: 'ACCOUNT_EMAIL_UNAVAILABLE' } });
  expect(logged).toHaveBeenCalledWith('Account email provider rejected request', { status: 403 });
  const output = JSON.stringify(logged.mock.calls);
  for (const privateValue of ['account-email-test@example.invalid', 're_private_test_key', '12345678']) expect(output).not.toContain(privateValue);
});

test('network failures retain the public service error without exposing transport details', async () => {
  vi.stubEnv('AUTH_RESEND_KEY', 're_private_test_key');
  vi.stubEnv('AUTH_EMAIL_FROM', 'Savage Master <noreply@example.invalid>');
  vi.stubEnv('SITE_URL', 'https://example.invalid');
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Transport details re_private_test_key account-email-test@example.invalid'); }));
  const t = convexTest(schema, modules);
  await expect(t.action(ref<'action'>('auth:signIn'), { provider: 'password', params: { flow: 'signUp', email: 'account-email-test@example.invalid', password: 'synthetic-password-123', acceptedTerms: TERMS_VERSION } })).rejects.toMatchObject({ data: { code: 'ACCOUNT_EMAIL_UNAVAILABLE' } });
  expect(logged).toHaveBeenCalledWith('Account email transport failed');
  expect(JSON.stringify(logged.mock.calls)).not.toContain('re_private_test_key');
  expect(JSON.stringify(logged.mock.calls)).not.toContain('account-email-test@example.invalid');
});
