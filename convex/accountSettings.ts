import { getAuthUserId, retrieveAccount, modifyAccountCredentials, invalidateSessions } from '@convex-dev/auth/server';
import { query, action, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { makeFunctionReference as ref } from 'convex/server';
export const mine = query({ args: {}, handler: async ctx => {
  const id = await getAuthUserId(ctx);
  const user = id ? await ctx.db.get(id) : null;
  return user ? { email: user.email, verified: !!user.emailVerificationTime } : null;
} });
export const userForPassword = internalQuery({ args: { id: v.id('users') }, handler: (ctx, { id }) => ctx.db.get(id) });
export const changePassword = action({ args: { currentPassword: v.string(), newPassword: v.string() }, handler: async (ctx, a) => {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error('Sign in to change your password.');
  if (a.currentPassword.length > 256 || a.newPassword.length < 8 || a.newPassword.length > 256) throw new Error('Use a new password between 8 and 256 characters.');
  const user = await ctx.runQuery(ref<'query', any>('accountSettings:userForPassword'), { id });
  if (!user?.email || !user.emailVerificationTime) throw new Error('Verify your email first.');
  let account;
  try { account = await retrieveAccount(ctx, { provider: 'password', account: { id: user.email, secret: a.currentPassword } }); }
  catch { throw new Error('Your current password could not be verified.'); }
  if (!account || account.user._id !== id) throw new Error('Your current password could not be verified.');
  await modifyAccountCredentials(ctx, { provider: 'password', account: { id: user.email, secret: a.newPassword } });
  await invalidateSessions(ctx, { userId: id });
} });
