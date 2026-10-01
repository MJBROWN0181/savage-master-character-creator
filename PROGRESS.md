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
Convex login now succeeds with access to team `mikebrown81`. Configured
JWT_PRIVATE_KEY and JWKS, then deployed the backend successfully to the
development deployment. The setup CLI displayed its initial generated key in
terminal output; that key pair was immediately replaced without displaying
the replacement. AUTH_RESEND_KEY and AUTH_EMAIL_FROM are still missing.

Next steps, in order:

1. Configure AUTH_RESEND_KEY and AUTH_EMAIL_FROM in development deployment
   `energized-swordfish-188` using an authorized Resend sender.
3. Verify live sign-up, email verification, sign-out/sign-in, cloud save/load,
   and password reset. Do not call the account feature complete before this.
4. Fix and verify ancestry bonus carryover, required heritage validation,
   and shield Parry stacking one at a time.

Hosting is Vercel. Production authentication configuration and live testing
must be checked separately from this development deployment.

## Domain and hosting

Purchased `smsheets.com` in Cloudflare; registration verified Active, expires
September 30, 2027. Created Vercel project `savage-master-character-creator`
under `michael-3e52` and successfully deployed the existing `main` branch
(commit c8ca513). This public deployment does not yet include the account-saving
feature branch. Its default URL is `savage-master-character-creator.vercel.app`.

Assigned `smsheets.com` and `www.smsheets.com` to the production environment.
Added DNS-only CNAME records for `@` and `www` pointing to Vercel's assigned
target `2e9816021f675568.vercel-dns-017.com`. Vercel reports Valid Configuration
for both domains. Both HTTPS URLs return HTTP 200 with Savage Master content;
the live character creator was also verified in the browser.

Resend account connected. Added domain `smsheets.com` (ID
`327cdf46-52c7-4b05-8af6-a7ced3a1abde`, us-east-1). Imported its DKIM TXT,
`rsend` and `send` CNAME records, and optional DMARC monitoring record through
Cloudflare. Public DNS matches the requested records. Resend verification is
pending. Configured development AUTH_EMAIL_FROM as
`Savage Master <noreply@smsheets.com>`.

Prepared a sending-only API-key form named `Savage Master verification emails`;
the key has not been created. Domain verification is now complete in Resend.
The prepared key is restricted to Sending access for `smsheets.com`.
User created and supplied the sending-only key. Configured AUTH_RESEND_KEY on
development and production without displaying the value or saving it locally.
A setup email to the owner's iCloud address was accepted by Resend (HTTP 200).
Inbox delivery remains unconfirmed. The supplied key appeared in chat and should
be replaced after setup; no key value is recorded in this progress file.

Production Convex deployment is `striped-jaguar-856`. Configured production
JWT_PRIVATE_KEY and JWKS without displaying values, SITE_URL as
`https://smsheets.com`, and AUTH_EMAIL_FROM as
`Savage Master <noreply@smsheets.com>`. Successfully deployed the feature
backend and its schema to production. AUTH_RESEND_KEY is now configured.
Public frontend is still the existing `main` branch. Before publishing the
account-saving frontend, configure Vercel's production Convex deploy key and
test live email authentication and account persistence.
