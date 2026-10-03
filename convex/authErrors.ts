import { ConvexError } from 'convex/values';

// Keep account-existence and credential failures indistinguishable to clients.
export function rethrowAccountError(error: unknown): never {
  const message = error instanceof Error ? error.message : '';
  if (['InvalidAccountId', 'InvalidSecret', 'Invalid credentials'].includes(message))
    throw new ConvexError({ code: 'INVALID_CREDENTIALS' });
  if (message === 'TooManyFailedAttempts')
    throw new ConvexError({ code: 'SIGNIN_RATE_LIMITED' });
  if (['Account email is not configured.', 'Could not send account email.'].includes(message))
    throw new ConvexError({ code: 'ACCOUNT_EMAIL_UNAVAILABLE' });
  if (message === 'Invalid password')
    throw new ConvexError({ code: 'PASSWORD_TOO_SHORT' });
  if (message === 'Invalid code')
    throw new ConvexError({ code: 'INVALID_EMAIL_CODE' });
  throw error;
}
