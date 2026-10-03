import type { Value } from 'convex/values';
import { TERMS_VERSION } from '../legal-terms.mjs';

export function passwordProfile(params: Record<string, Value | undefined>) {
  if (typeof params.email !== 'string' || !params.email) throw new Error('Enter your email.');
  const profile = { email: params.email };
  // The Password provider calls this for sign-in and reset flows as well.
  // Only an explicit signup agreement creates an acceptance record.
  if (params.flow !== 'signUp') return profile;
  if (params.acceptedTerms !== TERMS_VERSION) {
    throw new Error('Confirm you are 18 or older and agree to the current Terms of Service.');
  }
  return { ...profile, termsAcceptedVersion: TERMS_VERSION, termsAcceptedAt: Date.now() };
}
