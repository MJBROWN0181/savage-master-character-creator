# October 3 completion audit

The production branch is feat/convex-character-accounts. The earlier character-creation commit 1721a26 is already pushed and deployed. This follow-up preserves the remaining completed community, account, profile, companion, and mobile work in the same branch.

## Included work

- Around the Fire feed, Guilds, and Bazaar, with reviewed-profile and verified-email posting requirements, private Guild chat, invitations, events, and listing moderation.
- Public post share pages and generated social preview images; private or unavailable posts do not expose their contents.
- Settings, profile review and notifications, deliberate profile deletion, connection/privacy controls, and password change/reset interfaces.
- Shared theme and control refinements, updated profile presentation, and animated 2D Bug gestures, flight, eyes, and support guidance.
- Character-creation Bug notices centered on phone screens. The previous separate game flows and unique Gilded Storybook art remain included.
- Authored Bug rehearsals and the shelved 3D experiment archived under design/prototypes with source texture and vendor license. These prototypes are excluded from production; the approved 2D companion remains active.
- The explicit sharp dependency is retained for the art tools. Local image-generation receipts and QA captures remain in ignored output. Environment secrets remain ignored.

## Validation

- npm run check passed.
- npm test passed: 232 tests (115 Vitest and 117 Node tests).
- npm run build passed, with existing classic-script and large-catalogue warnings.
- Guest browser checks passed for the campfire feed, Guilds, Bazaar, and Settings with no console errors.
- The mobile character notice fits and centers at 375 by 812 and 390 by 600.
- Password changes, live email delivery, and destructive profile actions were not executed against real accounts during this audit; automated tests cover community/profile access, cleanup, and notification behavior. Live password and email delivery remain unverified.

Push and release verification are recorded in the GitHub v1.1.0-preview.4 release notes.
