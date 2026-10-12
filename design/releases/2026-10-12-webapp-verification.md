# October 12 web application verification

The tested application revision is `555c71054f921d550376b56927c017562e839115`
on `feat/convex-character-accounts`. This record accompanies
`v1.1.0-preview.6`. The application source was unchanged during verification.

## Changes since preview.5

- Terms, privacy information, publisher credits, and the account-creation agreement.
- Private profile moderation, protected owner/admin access, and earned portrait frames.
- Community pause enforcement for friends and private Guilds.
- Actionable password sign-in errors that avoid exposing internal server details.

These changes were already committed before this verification pass. This follow-up
records the checks and release scope; it does not introduce new application behavior.

## Validation

- `npm run check` passed.
- `npm test` passed, including the Vitest suite and 130 Node tests.
- `npm run build` passed, including install verification for 14 entry pages,
  eight icons, and 89 offline asset paths.
- Native Python Playwright with headless Chromium passed 92 browser scenarios:
  80 page/layout checks and 12 interaction scenarios.
- The page matrix covered 16 routes at 1440 by 1000 and 390 by 844 in both
  light and dark themes, plus 320 by 740 in light mode.
- No horizontal overflow, uncaught JavaScript exceptions, console errors,
  failed HTTP responses, or broken loaded images were recorded in the page matrix.

The routes were home, game selection, all three character builders, World Builder,
sign-in and sign-up entry pages, campaigns, Around the Fire, pricing, support,
settings, installation, legal information, and the signed-out admin entry page.

Interaction scenarios ran at desktop and phone widths. They covered navigation,
password-recovery form selection, theme persistence, complete D&D creation through
the final sheet, Pathfinder origins and all attribute-boost stages, Savage Worlds
setting/ancestry selection, creation books, local draft restoration, world backup
export/import, support draft download, community tab selection, and opening/closing
the Bug using its intended hover behavior.

The local Vite frontend used the configured backend for anonymous queries. Fresh
browser contexts contained no signed-in sessions. No account creation, reset-code
request, support submission, or billing transaction was sent.

## Verification limits

Signed-in accounts, private campaign screens, account/cloud saving, real ticket
submission, email delivery, billing transactions, physical-device installation,
and offline browser behavior were not exercised in this pass. Phone coverage used
Chromium viewport emulation, without physical touch-device or Safari testing.

The build emitted classic-script and large-chunk warnings. The largest chunk was
Pathfinder at approximately 3.73 MB minified / 801 KB gzip. Throttled mobile load
performance was not measured. Automated backend and offline logic checks do not
substitute for real account, delivery, or device verification.

## Evidence

Ignored local artifacts are in `output/webapp-testing-2026-10-12/`:
`report.md`, `final-results.json`, corrected `verify.py`, screenshots, and downloaded
synthetic backup/report files. The final evidence combines the successful 80-page
matrix with the successful 12-scenario interaction rerun. Earlier harness failures
were resolved by correcting selectors and following modal/hover interactions;
application source was unchanged between runs.

The pre-existing untracked `marketing/` directory was excluded from this release
commit. Local dependency packages, environment files, and browser artifacts are
not committed.
