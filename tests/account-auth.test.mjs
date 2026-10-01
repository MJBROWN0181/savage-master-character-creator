import test from 'node:test';
import assert from 'node:assert/strict';
import { needsEmailVerification, normalizeEmailCode, accountErrorMessage } from '../account-auth.mjs';

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

test('pasted email codes preserve leading zeros and remove formatting', () => {
  assert.equal(normalizeEmailCode(' 0012-3456\n'), '00123456');
  assert.equal(normalizeEmailCode('00 12 34 56'), '00123456');
});

test('verification failure explains how to retry without exposing raw server errors', () => {
  const error = new Error('[CONVEX A(auth:signIn)] Server Error Called by client');
  for (const mode of ['email-verification', 'reset-verification']) {
    assert.equal(accountErrorMessage(mode, error), 'Incorrect code. Enter the code from your latest email and try again.');
    assert.doesNotMatch(accountErrorMessage(mode, error), /CONVEX/);
  }
  assert.equal(accountErrorMessage('signIn', new Error('Invalid password')), 'Invalid password');
});
