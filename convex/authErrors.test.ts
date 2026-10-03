import { expect, test, vi } from 'vitest';
import { generateKeyPair, exportPKCS8 } from 'jose';
import { ConvexError } from 'convex/values';
import { rethrowAccountError } from './authErrors';
import { convexTest } from 'convex-test';
import { makeFunctionReference as ref } from 'convex/server';
import schema from './schema';
import { Password } from '@convex-dev/auth/providers/Password';
const modules = import.meta.glob('./**/*.ts');

test('unknown accounts and wrong passwords return the same safe error without exposing account existence', () => {
  for (const source of ['InvalidAccountId', 'InvalidSecret', 'Invalid credentials']) {
    try { rethrowAccountError(new Error(source)); }
    catch (error) { expect(error).toBeInstanceOf(ConvexError); expect((error as ConvexError<any>).data).toEqual({ code: 'INVALID_CREDENTIALS' }); }
  }
});
test('expected service and rate errors retain safe categories, and unexpected failures remain server errors', () => {
  for (const [message, code] of [['TooManyFailedAttempts', 'SIGNIN_RATE_LIMITED'], ['Could not send account email.', 'ACCOUNT_EMAIL_UNAVAILABLE'], ['Account email is not configured.', 'ACCOUNT_EMAIL_UNAVAILABLE']]) {
    try { rethrowAccountError(new Error(message)); }
    catch (error) { expect((error as ConvexError<any>).data).toEqual({ code }); }
  }
  const privateError = new Error('Internal credentials or database error');
  expect(() => rethrowAccountError(privateError)).toThrow(privateError);
});
test('the real password action propagates a safe credential error for an unknown account', async () => {
  const t = convexTest(schema, modules);
  await expect(t.action(ref<'action'>('auth:signIn'), { provider: 'password', params: { flow: 'signIn', email: 'nobody@example.invalid', password: 'dummy-invalid-password' } })).rejects.toMatchObject({ data: { code: 'INVALID_CREDENTIALS' } });
  expect(await t.run(ctx => ctx.db.query('users').collect())).toEqual([]);
});
test('an existing account with the wrong password gets the same safe error and no sign-in session', async () => {
  const t = convexTest(schema, modules);
  const provider = Password();
  const config = (provider as typeof provider & { options: typeof provider }).options;
  const secret = await config.crypto!.hashSecret('correct-test-password');
  const id = await t.run(async ctx => {
    const userId = await ctx.db.insert('users', { email: 'member@example.invalid', emailVerificationTime: 1 });
    await ctx.db.insert('authAccounts', { userId, provider: 'password', providerAccountId: 'member@example.invalid', emailVerified: 'member@example.invalid', secret });
    return userId;
  });
  await expect(t.action(ref<'action'>('auth:signIn'), { provider: 'password', params: { flow: 'signIn', email: 'member@example.invalid', password: 'wrong-test-password' } })).rejects.toMatchObject({ data: { code: 'INVALID_CREDENTIALS' } });
  expect(await t.run(ctx => ctx.db.query('authSessions').collect())).toEqual([]);
  expect((await t.run(ctx => ctx.db.get(id)))?.emailVerificationTime).toBe(1);
});
test('valid passwords still create a session through the unchanged password verification path', async () => {
  const { privateKey } = await generateKeyPair('RS256', { extractable: true });
  vi.stubEnv('JWT_PRIVATE_KEY', await exportPKCS8(privateKey));
  vi.stubEnv('CONVEX_SITE_URL', 'https://test.convex.site');
  try {
    const t = convexTest(schema, modules);
    const provider = Password();
    const config = (provider as typeof provider & { options: typeof provider }).options;
    const secret = await config.crypto!.hashSecret('correct-test-password');
    await t.run(async ctx => {
      const userId = await ctx.db.insert('users', { email: 'member@example.invalid', emailVerificationTime: 1 });
      await ctx.db.insert('authAccounts', { userId, provider: 'password', providerAccountId: 'member@example.invalid', emailVerified: 'member@example.invalid', secret });
    });
    const result: any = await t.action(ref<'action'>('auth:signIn'), { provider: 'password', params: { flow: 'signIn', email: 'member@example.invalid', password: 'correct-test-password' } });
    expect(result.tokens?.token).toBeTruthy();
    expect(await t.run(ctx => ctx.db.query('authSessions').collect())).toHaveLength(1);
  } finally { vi.unstubAllEnvs(); }
});
