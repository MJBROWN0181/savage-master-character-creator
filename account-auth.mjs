export function needsEmailVerification(mode, result) {
  return (mode === 'signUp' || mode === 'signIn') && !result.signingIn;
}

export function normalizeEmailCode(code) {
  return String(code).replace(/[\s-]/g, '');
}

export function accountErrorMessage(mode, error) {
  if (mode === 'email-verification' || mode === 'reset-verification') {
    return 'We could not verify that code. Use the code from your latest email and try again.';
  }
  return error.message || 'Could not sign in. Please try again.';
}
