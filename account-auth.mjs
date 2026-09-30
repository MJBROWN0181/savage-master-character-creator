export function needsEmailVerification(mode, result) {
  return (mode === 'signUp' || mode === 'signIn') && !result.signingIn;
}
