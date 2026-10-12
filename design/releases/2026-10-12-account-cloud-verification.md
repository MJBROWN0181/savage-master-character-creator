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
Both reached successful production deployments. The Pathfinder deployment was
confirmed at 2026-10-12 11:34:38 UTC (GitHub deployment 7013051089).

## Live results

| Workflow | Result |
| --- | --- |
| Sign up | Passed: a dedicated QA account reaches the email-code form and Resend accepts its verification message. |
| Email code verification | Passed using the dedicated QA message in the owner's Resend preview. It opens an authenticated account. Inbox delivery remains unverified. |
| Sign in and sign out | Passed with valid credentials; incorrect credentials are rejected. |
| Password reset | Passed using the dedicated QA message in Resend preview. The new password signs in and the previous password is rejected. |
| D&D account save | Passed on the live site. Fresh-browser account loading remains unverified. |
| Pathfinder account save/load | Live testing reproduced the field-order validation failure. The deployed fix passes regression checks; its final live round trip remains unverified. |
| Savage Worlds account save/load | Final authenticated round trip remains unverified. |
| Local backups and drafts | All three systems passed export/import, identical restoration in a fresh browser, and persistence after reload (nine checks). |

Resend reports delayed delivery to the connected QA mailbox with SMTP
`421 4.4.1 Failed to establish connection`. Codes for the successful application
tests came from the owner's provider preview, not the receiving inbox. This proves
the application code flows, not mailbox delivery. A working inbox was requested.

The final cloud rerun was interrupted first by a browser navigation abort, then
the signed-in Edge connection became unavailable before the next QA code could be
retrieved. Completing the three-system fresh-browser cloud round trip requires
that browser connection or access to a working test inbox. No authentication
protection was bypassed to complete the checks.

## Automated validation

- `npm run check` passed.
- `npm test` passed: 143 Vitest tests and 131 Node tests.
- `npm run build` passed, including install build verification.
- The new Pathfinder regression tests fail before the fix and pass after it.
  They cover nested field reordering and rejection of changed catalogue data.
- Account email tests exercise the real signup/reset providers with mocked HTTP
  delivery, surrounding credential whitespace, and private diagnostic redaction.

Build warnings for classic scripts and the large Pathfinder bundle remain.
Synthetic QA accounts and a named D&D character remain in production. Passwords,
verification codes, provider keys, and authenticated browser sessions are not
stored in the test artifacts or repository. Existing owner passwords were not
changed. The unrelated untracked `marketing/` directory was excluded.

Ignored detailed evidence is under `output/webapp-testing-2026-10-12/`, including
`live-account-results.json`, `live-backup-results.json`, `auth-verified.png`,
the synthetic fixtures, and the Python browser harnesses. Earlier harness errors
and the failed pre-fix Pathfinder attempt are superseded only where a later
successful check is explicitly recorded above.
