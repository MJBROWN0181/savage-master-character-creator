import test from 'node:test';
import assert from 'node:assert/strict';
import { needsEmailVerification } from '../account-auth.mjs';

test('sign-up and unverified sign-in request the email code instead of reporting success', () => {
  for (const mode of ['signUp', 'signIn']) {
    assert.equal(needsEmailVerification(mode, { signingIn: false }), true);
    assert.equal(needsEmailVerification(mode, { signingIn: true }), false);
  }
});

test('reset and email-code flows do not restart initial email verification', () => {
  for (const mode of ['reset', 'reset-verification', 'email-verification']) {
    assert.equal(needsEmailVerification(mode, { signingIn: false }), false);
  }
});
