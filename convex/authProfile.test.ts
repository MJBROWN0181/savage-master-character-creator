import { test, expect, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from './schema';
import { passwordProfile } from './authProfile';
import { TERMS_VERSION } from '../legal-terms.mjs';
const modules = import.meta.glob('./**/*.ts');

test('signup rejects omitted, unchecked, and outdated agreements before account creation', () => {
  for (const acceptedTerms of [undefined, false, '', 'on', '2026-01-01']) {
    expect(() => passwordProfile({ flow: 'signUp', email: 'terms@test.example', acceptedTerms })).toThrow('agree to the current Terms');
  }
});

test('an explicit signup records the current version and a server timestamp durably', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1791061200000);
  try {
    const data = passwordProfile({ flow: 'signUp', email: 'terms@test.example', acceptedTerms: TERMS_VERSION, termsAcceptedAt: 1 });
    const t = convexTest(schema, modules);
    const id = await t.run(ctx => ctx.db.insert('users', data));
    const saved = await t.run(ctx => ctx.db.query('users').withIndex('email', q => q.eq('email', data.email)).unique());
    expect(saved?._id).toBe(id);
    expect(saved?.termsAcceptedVersion).toBe(TERMS_VERSION);
    expect(saved?.termsAcceptedAt).toBe(1791061200000);
  } finally { clock.mockRestore(); }
});

test('sign-in, verification, and reset do not impose signup consent or fabricate acceptance', () => {
  for (const flow of ['signIn', 'reset', 'reset-verification', 'email-verification']) {
    expect(passwordProfile({ flow, email: 'existing@test.example', acceptedTerms: TERMS_VERSION })).toEqual({ email: 'existing@test.example' });
  }
});
