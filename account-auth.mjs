export function needsEmailVerification(mode, result) {
  return (mode === 'signUp' || mode === 'signIn') && !result.signingIn;
}

export function normalizeEmailCode(code) {
  return String(code).replace(/[\s-]/g, '');
}

export function accountErrorMessage(mode, error) {
  const messages = {
    INVALID_CREDENTIALS: 'Email or password does not match. Try again, or use Forgot password?',
    SIGNIN_RATE_LIMITED: 'Too many sign-in attempts. Wait a few minutes before trying again.',
    ACCOUNT_EMAIL_UNAVAILABLE: 'We could not send your account email. Please try again shortly. If it keeps happening, contact support.',
    PASSWORD_TOO_SHORT: 'Use a password with at least 8 characters.',
    INVALID_EMAIL_CODE: 'Incorrect code. Enter the code from your latest email and try again.',
  };
  const code = error?.data?.code;
  if (Object.hasOwn(messages, code)) return messages[code];
  const legacyCodes = { InvalidAccountId: 'INVALID_CREDENTIALS', InvalidSecret: 'INVALID_CREDENTIALS', 'Invalid credentials': 'INVALID_CREDENTIALS', TooManyFailedAttempts: 'SIGNIN_RATE_LIMITED', 'Invalid password': 'PASSWORD_TOO_SHORT' };
  if (Object.hasOwn(legacyCodes, error?.message)) return messages[legacyCodes[error.message]];
  if (mode === 'email-verification' || mode === 'reset-verification') {
    return 'Could not verify that code. Try the code from your latest email. If it keeps happening, contact support.';
  }
  if (mode === 'reset') return 'Could not send a reset code. Please try again shortly. If it keeps happening, contact support.';
  if (mode === 'signUp') return 'Could not create your account. Please try again, or sign in if you already have an account.';
  return 'Could not sign in. Try again, or use Forgot password? If it keeps happening, contact support.';
}
