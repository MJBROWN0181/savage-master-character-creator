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

### Export follow-up

Testing found that the previous Roll20 export was incompatible with the Official
Savage Worlds sheet's JSON Importer. Replaced its nested format with the importer's
top-level fields and ran the actual upstream importer in an isolated JavaScript
context against five builds (core plus all four settings). All passed, including
attributes, skills, hindrances, weapons, shield inventory, and powers/Power Points.
Run `npm run test:vtt` to repeat this check against the current official importer.

Updated Foundry movement, Power Points, equipment state, armor locations, and Edge
requirements against the SWADE v6.0.4 release source. Field assertions pass for the
same five builds. Parry and Toughness use manual values on import to preserve builder
results, including modifiers not represented as Active Effects. This is source-level
validation, not execution inside a Foundry world or Roll20 game.

Sources:
- https://github.com/Roll20/roll20-character-sheets/tree/master/Official%20Savage%20Worlds
- https://gitlab.com/peginc/swade/-/tree/v6.0.4/src/module/data

1. Live cloud save/load is now verified: saved `TEST - Cloud save round-trip`,
   refreshed the site with the session and cloud record intact, imported a different
   local draft, and loaded the cloud copy. Name, Agility d8, Vigor d6, Fighting d6,
   and derived stats returned correctly. Sign-out also returned to the sign-in form.
   A clearly named test record remains in the account. Password reset is prepared
   for the owner to complete, since browser credential rules require user entry of
   the new password. Reset completion and sign-in with it remain pending.
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
