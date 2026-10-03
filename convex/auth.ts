import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth } from "@convex-dev/auth/server";
import { emailVerification, passwordReset } from "./passwordReset";
import { passwordProfile } from './authProfile';
import { awardVerifiedMember } from './profileFrames';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { rethrowAccountError } from './authErrors';

const passwordProvider = Password({ reset: passwordReset, verify: emailVerification, profile: passwordProfile });
// Password defers its implementation in options until Convex Auth materializes it.
// Preserve its hashing, reset, and verification providers while wrapping the real authorize callback.
const passwordConfig = (passwordProvider as typeof passwordProvider & { options: typeof passwordProvider }).options;
const safePasswordProvider = ConvexCredentials({
  ...passwordConfig,
  authorize: async (...args: Parameters<typeof passwordConfig.authorize>) => {
    try { return await passwordConfig.authorize(...args); }
    catch (error) { rethrowAccountError(error); }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [safePasswordProvider],
  callbacks: { afterUserCreatedOrUpdated: async (ctx, { userId }) => {
    await awardVerifiedMember(ctx as MutationCtx, userId as Id<'users'>);
  } },
});
