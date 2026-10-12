# October 12 account email and character storage fixes

Live testing at https://smsheets.com found and repaired two production failures.
Account email authorization headers contained surrounding whitespace, which Convex
rejected before contacting Resend. The email sender now trims configuration, uses
native fetch, and records bounded diagnostics with keys, codes, and recipients
redacted. Pathfinder's catalogue validator compared JSON text, so Convex's object
field reordering made unchanged feats, spells, and equipment appear altered. It
now compares complete nested data independently of object field order, preserving
array order and rejecting added, removed, or changed fields.

Application fixes: `9e41bc224c134e2248dd5730b5fc11cbb141f52d` (email normalization)
and `df007b9f8cf02cc45fee68a976cf9caefce40483` (Pathfinder validation).
Both reached successful production deployments. The complete live run finished
at 2026-10-12 11:51:28 UTC against release `v1.1.0-preview.7`, revision
`e7ab18d3f3df9f09dd960fe63ba00623690c0dd2` (successful production deployment
7013161551).

## Live results

| Workflow | Result |
| --- | --- |
| Sign up | Passed: a new dedicated QA account receives its verification email in the owner's iCloud inbox. |
| Email code verification | Passed: the owner supplied the inbox code, which opens an authenticated account. |
| Sign in and sign out | Passed with valid credentials; incorrect credentials are rejected. |
| Password reset | Passed: a second code received in iCloud sets a new password. The new password signs in and the previous password is rejected. |
| D&D account save/load | Passed: saved to the live account, then loaded in a fresh browser context with identical exported character data. |
| Pathfinder account save/load | Passed after the field-order fix: feats, weapon, armor, and inventory survive the live account round trip with identical exported data. |
| Savage Worlds account save/load | Passed: saved to the live account, then loaded in a fresh browser context with identical exported character data. |
| Local backups and drafts | All three systems passed export/import, identical restoration in a fresh browser, and persistence after reload (nine checks). |

The completed run contains 15 distinct live checks. Both email codes came from
the receiving iCloud inbox with the owner's assistance; mailbox access was not
automated. A separate, newly created browser context started with no copied
cookies, authentication storage, or local character drafts. It signed in using
the reset password and loaded each character in a new tab. Saved and restored
editable backups matched as complete parsed JSON objects for all three systems.

The earlier MySeptic-domain test mailbox still had SMTP `421 4.4.1` delivery
delays; the successful iCloud run does not establish delivery to that mailbox.
Earlier driver navigation aborts were superseded by the completed fresh-context
round trip. Public navigation probes also passed with service workers allowed
and blocked. No authentication protection was bypassed.

## Automated validation

- `npm run check` passed.
- `npm test` passed: 143 Vitest tests and 131 Node tests.
- `npm run build` passed, including install build verification.
- The new Pathfinder regression tests fail before the fix and pass after it.
  They cover nested field reordering and rejection of changed catalogue data.
- Account email tests exercise the real signup/reset providers with mocked HTTP
  delivery, surrounding credential whitespace, and private diagnostic redaction.

Build warnings for classic scripts and the large Pathfinder bundle remain.
Synthetic QA accounts and named test characters remain in production. Passwords,
verification codes, provider keys, and authenticated browser sessions are not
stored in the test artifacts or repository. Existing owner passwords were not
changed. The unrelated untracked `marketing/` directory was excluded.

Ignored detailed evidence is under `output/webapp-testing-2026-10-12/`, including
`live-account-results.json`, `live-backup-results.json`, `auth-verified.png`,
`cloud-dnd-loaded.png`, `cloud-pathfinder-loaded.png`, `cloud-savage-loaded.png`,
the synthetic fixtures, and the Python browser harnesses. Earlier harness errors
and the failed pre-fix Pathfinder attempt are superseded only where a later
successful check is explicitly recorded above.
