# Savage Master continuation

## September 30, 2026

Branch: `feat/convex-character-accounts`.

The previous handoff kept account saving open until live sign-up and cloud
save/load could be verified. Local persistence, backup import, and account
ownership checks were already implemented.

Fixed the account form's interpretation of Convex Auth's sign-in response:
the API returns `{ signingIn }`, not a boolean. Sign-up and unverified sign-in
now display the email-code form when verification is required. Added regression
coverage and updated `@auth/core` to the patched 0.41.3 release.

Validation: all six tests, Convex typecheck, and production build pass.
The dependency audit reports zero vulnerabilities.

The development deployment's auth discovery endpoint responds with HTTP 200.
The current local Convex credentials do not have access to the selected project.
JWT key configuration and Resend sender configuration remain unverified.

Next steps, in order:

1. Log in to Convex with the account that has access to team `mikebrown81`,
   project `savage-master-character-creator`, deployment `energized-swordfish-188`.
2. Check JWT_PRIVATE_KEY, JWKS, AUTH_RESEND_KEY, and AUTH_EMAIL_FROM without
   displaying their values. Complete missing configuration.
3. Verify live sign-up, email verification, sign-out/sign-in, cloud save/load,
   and password reset. Do not call the account feature complete before this.
4. Fix and verify ancestry bonus carryover, required heritage validation,
   and shield Parry stacking one at a time.

Hosting is Vercel. Production authentication configuration and live testing
must be checked separately from this development deployment.
