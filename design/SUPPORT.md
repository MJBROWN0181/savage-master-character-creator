# Support and the Bug

`/support` is the real support page. Each Vite entry includes a small corner
companion, **the Bug**, a dark fantasy winged insect carrying a tome of code.
The dialog uses native focus trapping, Escape to close, and returns focus to its
button. No automatic popups or report submission.

Players choose bug report or support request, provide a reply email, and send.
Guests can report sign-in problems. Signed-in players can see their own latest
30 tickets and team replies. Guests keep their ticket reference and receive
manual replies by email. Failed submissions preserve the form in session storage;
copy/download works even without the backend. Ticket submission is idempotent.

`bug-capture.js` runs before the app and retains up to ten recent runtime,
unhandled promise, console, and script/style-load errors in memory. The attachment
includes page path (no query/hash), browser, viewport and online status. Common
credential labels, bearer tokens, URLs' queries/fragments and email addresses are
redacted. The player can review/edit/omit it. Arbitrary error text can contain
other personal information; users review what they send. No snapshots of game
state, storage, passwords, character sheets or journals are collected.
Handled failures can call `window.smBugCapture.record('Save error', error)` or
dispatch `sm:error` with an Error/string detail.

## Team notification configuration

Cloudflare Email Routing is active for `support@smsheets.com` and forwards to
the verified destination `mjbrown0181@icloud.com`. The development and production
Convex deployments have the support destination and sender configured.
A setup test sent to the support address was accepted by Resend and recorded as
**Forwarded** in Cloudflare's Email Routing activity log on October 2, 2026.

Set these **server-side Convex variables**, never `VITE_` variables:

- `SUPPORT_EMAIL_TO=support@smsheets.com` (Cloudflare forwards to the owner's iCloud)
- `SUPPORT_EMAIL_FROM=Savage Master Support <support@smsheets.com>`
- `SUPPORT_RESEND_KEY`, or reuse the existing `AUTH_RESEND_KEY` with sending permission

`SUPPORT_EMAIL_FROM` falls back to `AUTH_EMAIL_FROM`. The receiving address must
be enabled and its forwarding destination verified before selecting it as the
notification destination. Tickets persist even if email is missing or fails.
Notifications retry twice and use Resend idempotency. The internal queue records
`pending`, `sent`, `unconfigured`, or `failed`; `sent` means provider acceptance,
not confirmed inbox delivery. Send no automatic email to unverified guest emails.

## Team queue

Use the Convex dashboard Functions page to run `support:queue` (internal).
`support:respond` takes ticket `id`, `status` (`open`, `in_progress`, `resolved`),
and `reply`. Signed-in owners see this response on the support page. For guest
requests, reply manually to the supplied email. Team functions are internal and
cannot be called by ordinary website clients. There is no public ticket search.

Per-account/per-email limits: one ticket per minute, five per day. A global
100/hour cap bounds guest abuse. Before a large public launch, consider a verified
anti-bot challenge for guest reports and an authenticated staff inbox.

Deploy backend and frontend together using the existing Vercel/Convex build.
Local build alone does not activate these functions on the live deployment.

## Bug's animations and Chronicles identity

`bug-mascot.jsx` and `bug-mascot.css` animate the approved illustration: brief
idle hovering, reading when an error is captured, carrying a report while sending,
a nod and seal after a ticket is saved, arrival on support, guidance at each
profile/setup step, and glowing code for updates and sharing. Idle motion stops
after two cycles. Reduced-motion settings disable animation. Error signals carry
no diagnostic details and never open a dialog automatically.

Bug's corner button links to support, the startup wizard (`/profile?tour=1`), and
his public page (`/profile?user=bug`). Existing players can reopen the tour.

`bug:ensureProfile` is an internal, idempotent initializer. It reserves `bug`,
creates a service author without credentials/email, and seeds one introduction.
Use `npx convex run bug:ensureProfile '{}'` on the intended deployment after
deploying. Do not impersonate a player whose handle conflicts with `bug`.

Set server-only `BUG_EDITOR_EMAILS` to comma-separated team addresses. Only
allowlisted accounts whose email is verified can use the reviewed public-update
composer on Bug's profile. The author remains Bug and the publishing user is
recorded privately. `bug:publishInternal` supports trusted dashboard publishing
with an idempotent publication key. Ticket bodies and diagnostics are never
published to Chronicles.

Players follow Bug using the existing Following feed. Every update has a public
`/chronicles?post=ID` link, native sharing/copy fallback, and signed-in sharing to
Chronicles for approved profiles. Reposts retain Bug's attribution, reference
the original instead of copying content, and deduplicate retries. Hidden or
unreviewed originals and mutual blocks also hide reposts and disable reactions.

Development setup on 2026-10-02: `energized-swordfish-188` has the seeded Bug
identity and intro, with `mjbrown0181@icloud.com` configured as the verified editor.
The production editor allowlist is configured too; production code and the Bug
identity still need a release.

## Posts after GitHub pushes

`.github/workflows/bug-chronicles.yml` runs on branch pushes to this repository,
including feature branches. Each push produces one public workshop note authored
by Bug, based on commit subject lines. He says “I fixed…”, “I added…”, or
“I untangled a bug…” and labels this as code work rather than an unverified live
release. A local commit becomes eligible when pushed. Tags, deleted branches,
empty pushes, forks and pull-request events do not publish updates.

The pinned checkout action runs `scripts/post-bug-update.mjs`. It excludes commit
bodies, author emails, diffs and file paths before sending an HMAC-SHA256 signed
request to `/bug/github`. The receiver validates the signature and configured
repository, redacts common secrets from titles, bounds the public summary,
preserves Bug’s official authorship and deduplicates by repository, branch and
commit SHA. Later retries keep the first note, even if the summary wording changes.
Transient errors retry; exhausted jobs fail visibly and can be rerun in Actions.
GitHub’s explicit skip-CI annotations can suppress push workflows.

`node scripts/setup-bug-updates.mjs` configures the existing development and
production Convex environments plus this repository’s Actions secret and endpoint
variable. Signing keys are never printed or committed. Reruns reuse the existing
development key. This requires authenticated CLI access to those deployments and
the repository’s Actions settings.

Configured on 2026-10-02: GitHub Actions has `BUG_GITHUB_WEBHOOK_SECRET` and
`BUG_CHRONICLES_ENDPOINT=https://striped-jaguar-856.convex.site/bug/github`.
Both Convex environments have the matching signing key and repository restriction.
The signed development ping returned HTTP 200. The workflow and production
receiver must be pushed/deployed before real public notes can start. The first
automated note will also create Bug’s service profile if necessary. Production
`BUG_EDITOR_EMAILS=mjbrown0181@icloud.com` is configured for manual editor publishing.

Validation follows GitHub’s primary documentation:
[signature validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries),
[push workflow triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
and [repository Actions secrets](https://docs.github.com/en/rest/actions/secrets).

## Mascot artwork

Final transparent PNG: `images/art/the-bug.png`, generated and edited with the
built-in image generation tool. Final edit prompt: “Transform the winged male bug
fairy into dark fantasy; retain the six-limbed insect, antennae, four wings and
open tome of code. Charcoal and deep petrol teal carapace, weathered antique
bronze armor, dark hooded mantle, subtle amber eyes, smokey translucent veined
wings, ancient leather code tome with glowing angle brackets and curly braces.
Painterly dark fantasy game art, restrained magic glow, approachable support
companion. Transparent background, full body, no wand, no weapons.”
