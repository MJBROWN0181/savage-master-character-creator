import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { emailVerification, passwordReset } from "./passwordReset";
import { passwordProfile } from './authProfile';
import { awardVerifiedMember } from './profileFrames';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({ reset: passwordReset, verify: emailVerification, profile: passwordProfile })],
  callbacks: { afterUserCreatedOrUpdated: async (ctx, { userId }) => {
    await awardVerifiedMember(ctx as MutationCtx, userId as Id<'users'>);
  } },
});
