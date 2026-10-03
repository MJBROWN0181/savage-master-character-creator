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
    assert.equal(accountErrorMessage(mode, error), 'Could not verify that code. Try the code from your latest email. If it keeps happening, contact support.');
    assert.doesNotMatch(accountErrorMessage(mode, error), /CONVEX/);
  }
  assert.equal(accountErrorMessage('signIn', new Error('Invalid password')), 'Use a password with at least 8 characters.');
});
test('credential failures explain recovery without revealing whether an account exists', () => {
  for (const source of ['InvalidAccountId', 'InvalidSecret', 'Invalid credentials']) {
    assert.equal(accountErrorMessage('signIn', new Error(source)), 'Email or password does not match. Try again, or use Forgot password?');
  }
  assert.equal(accountErrorMessage('signIn', { data: { code: 'INVALID_CREDENTIALS' } }), 'Email or password does not match. Try again, or use Forgot password?');
});
test('unexpected errors never show raw Convex internals or private server messages', () => {
  for (const mode of ['signIn', 'signUp', 'reset', 'email-verification', 'reset-verification']) {
    for (const error of [new Error('[CONVEX A(auth:signIn)] [Request ID: 2d8b781ae6f742f2] Server Error Called by client'), new Error('private@example.test'), null, { data: { code: '__proto__' } }]) {
      assert.doesNotMatch(accountErrorMessage(mode, error), /CONVEX|Request ID|private@example/);
    }
  }
  assert.match(accountErrorMessage('signIn', { data: { code: 'SIGNIN_RATE_LIMITED' } }), /Wait a few minutes/);
  assert.match(accountErrorMessage('signIn', { data: { code: 'ACCOUNT_EMAIL_UNAVAILABLE' } }), /could not send your account email/);
});
