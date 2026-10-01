# Savage Master site review — September 30, 2026

## Shipped improvements

- Updated Convex Auth to 0.0.96 and Vitest to 5.0.3. `npm outdated` is empty;
  `npm audit` reports no known vulnerabilities.
- Added explicit Core SWADE / Homebrew selection, introductory saving guidance,
  keyboard navigation for steps and selectable cards, and accessible validation alerts.
- Fixed ancestry/heritage attribute bonuses carrying into another ancestry or setting,
  required heritage selection, hindrance overspending validation, and shield Parry stacking.
- Added Find Players & Help with community links, local/cloud saving explanations,
  export guidance, and a copy-site-link button. Characters remain private; this button
  only copies the public site URL.
- Added canonical and social-preview metadata, robots.txt, and sitemap.xml.
- Removed missing banner/background/store images and displayed retailer links instead
  of stale hardcoded prices. Replaced a dated campaign promotion with publisher news.
- Changed static publishing to an explicit asset list so setup screenshots and notes
  cannot be copied into the public build. Offline caching includes Vite bundles and
  referenced assets, uses a content-based version, and no longer fails on missing images.

## Validation

12 tests pass, including account response handling, backup persistence, owner isolation,
and the four new builder regression cases. Typecheck and production build pass.
Built offline cache references were checked against disk; all assets exist.
Browser review covered desktop and 390px phone layouts, help/back navigation,
and the missing-heritage prompt. This is not certification of every game rule.

## Remaining checks

1. Complete an owner-driven live cloud save/load and password-reset test.
   Successful production sign-in appeared in backend logs during earlier setup,
   but cloud round-trip and reset are not yet confirmed.
2. Import exports into actual current Foundry SWADE and Roll20 sheets. Existing
   export formats have not been certified against those running products.
3. Replace the Resend key supplied in chat; keep replacement secrets out of chat
   and source control.
4. Audit setting data against the group's actual rulebook editions and errata.
   Some ancestry abilities are descriptive only (for example, Android programming).
   Setting-specific creation rules require additional checks; the builder should not
   be advertised as covering every rule.
5. Confirm rights for the existing published-setting text and artwork before a
   broad promotion campaign. Pinnacle's current licensing page excludes settings
   such as Deadlands and Rifts from its Fan License and restricts reproduction of
   copyrighted rulebook material. This review cannot establish existing permission.
   Source: https://shop.peginc.com/pages/licensing

## Reaching players

The community links come from Pinnacle's current getting-started guide:
https://shop.peginc.com/pages/new-to-savage-worlds

Recommended sequence after the remaining checks:

1. Invite a small group of Savage Worlds players and GMs to test one complete
   character each. Collect setting, device, export destination, and exact issues.
2. Prepare a short walkthrough showing creation, a save, and a successful export.
3. Ask moderators about sharing a free fan tool in r/savageworlds, the unofficial
   Savage Worlds Discord, and Pinnacle forums. Follow each community's rules.
4. Offer a few original sample characters and an editable backup for a one-shot.
   Do not redistribute copyrighted setting text or artwork without permission.
5. Add shareable, read-only character links later, with explicit opt-in publication
   and revocation. Current account records must remain private by default.

Suggested beta invitation, for review only:

> I built Savage Master at smsheets.com, a fan-made Savage Worlds character builder.
> It supports local drafts, account saves, editable backups, and VTT export formats.
> I'm looking for players and GMs to test a character and tell me where the flow
> gets confusing or the results need correcting. Which settings do you play?

No announcements, invitations, or community posts were sent by this review.
