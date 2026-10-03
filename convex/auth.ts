import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { emailVerification, passwordReset } from "./passwordReset";
import { passwordProfile } from './authProfile';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({ reset: passwordReset, verify: emailVerification, profile: passwordProfile })],
});
