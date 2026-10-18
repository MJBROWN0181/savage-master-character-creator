# Campaign character safe open: implementation checks

October 17, 2026. Companion to the [implementation brief](CAMPAIGN-CHARACTER-SAFE-OPEN-BRIEF.md).

**Status at planning time:** test plan only; no proposed-feature checks had been executed. Existing historical passes do not count as new feature evidence.

**Execution update, October 17:** local implementation and checks are recorded in the [execution report](releases/2026-10-17-campaign-character-safe-open.md). This document remains the scenario inventory; installed-client, physical-device, and production cases must not be inferred as passing from the local results.

Use synthetic fixtures first. Local unit/DOM tests, local real-browser tests, production behavior, and physical-device results must be reported separately. Do not use real private sheets, credentials, or journal contents in screenshots/logs. Do not create production accounts or alter real records during this planning step.

## Fixtures and evidence

Create a GM, two players, and an outsider in a local test backend. Each player owns a distinct named character. Provide one campaign per engine and appropriate membership/attachment records. The GM begins without a personal attachment; include a separate scenario where the GM is explicitly attached to their own character.

Include:

- Core SWADE with legacy/null setting, a Savage Pathfinder setting character, a D&D caster with multiclass/language/equipment data, and a Pathfinder caster with feats, inventory, and casting state.
- Complete characters that pass current validators, an incomplete meaningful local draft, and untouched initial starter data.
- Legacy cloud rows without `revision`; new records with revisions; a saved local draft with valid owner/revision metadata; a legacy local draft with none; mismatched/partial metadata.
- Two independent browser contexts for the same account, plus a context signed in as a different account. Separate tabs are an additional case, not a replacement for independent storage contexts.
- A delayed load, a delayed save response, a rejected mutation, storage-write/serialization failure, and a connection interruption.

For each pass/fail, record test ID, engine, fixture, expected versus observed behavior, and exact tested revision. For data preservation, compare complete parsed character payloads and journey state; inspect raw stored data where byte-for-byte cancellation matters. Sort object keys for semantic equality but preserve array order. Do not reduce comparison to names or a few displayed stats.

## Backend contract checks

| ID | Acceptance | Scenario and required result |
| --- | --- | --- |
| B01 | AC01, AC08 | Player opens their campaign locator. The resolved ID/snapshot is exactly their attached owned character. Repeat for all three engines, including Savage Pathfinder staying in Savage Worlds. Opening performs no write or revision increment. |
| B02 | AC02, AC08 | Outsider, signed-out caller, revoked member, forged campaign ID, another player's direct ID, and GM trying a player's character receive unavailable/sign-in/access errors without private payloads. A rejected write leaves the original record unchanged. |
| B03 | AC02 | Missing attachment, deleted attachment, missing system, wrong engine, and contradictory snapshot markers fail safely. No substitute character is selected. GM without an attachment gets no player sheet; GM with an owned attachment opens only that attachment. |
| B04 | AC05, AC09 | Load a legacy row without revision: return revision 0. First guarded update with expected 0 succeeds at 1 and preserves all other fields. Another update with expected 0 fails. New creates start at 1. |
| B05 | AC05 | A and B load revision N. A submits different edits and succeeds at N+1. B submits expected N and conflicts. Cloud remains exactly A's payload. Repeat with reversed order and closely scheduled concurrent submissions. Exactly one distinct update succeeds. |
| B06 | AC05, AC08, AC11 | Missing, negative, fractional, nonnumeric, and incorrect expected revisions cannot update an existing row. A submitted expected owner scope must equal the authenticated owner for creates and updates; switching authentication between click and submission rejects the old operation. Client-supplied owner or revision data in a backup cannot authorize a write. Existing ownership/validation rules still reject malformed payloads. |
| B07 | AC09 | Call every existing public snapshot-write path with an old-client, unversioned existing-record update. All fail closed. Old create and raw load behavior remains as specified. An optional endpoint cannot bypass the protected path. |
| B08 | AC01, AC08 | Caller-only campaign summary contains no other member's private snapshot/revision or private journal. Player results continue to exclude GM scenes. A mapping changed after the initial summary is re-resolved at destination. |
| B09 | AC12 | Reject malformed/overspent/invalid characters under the current validators; preserve successful legal cases. Guarded updates cannot switch a record between engines. Legitimate Savage Worlds setting edits retain existing rules. |
| B10 | AC08 | Remove campaign membership after opening. Campaign reopening fails; the user can still load/save their own character through the ordinary owner-only library. No campaign secret remains in a new response. |

Extend `convex/characters.test.ts`, `convex/campaigns.test.ts`, and affected existing Pathfinder/validation fixtures. Preserve coverage for languages, multiclass spell grants, catalogue ordering, ownership, and invalid data; do not delete assertions to accommodate the new interface.

## Editor and draft checks

| ID | Acceptance | Scenario and required result |
| --- | --- | --- |
| D01 | AC01, AC12 | From each campaign, select Open my character. Open the exact record in the existing Character sheet/Review destination. Back to campaign preserves the intended campaign and enters Gaming Table. No new wizard or automatically completed invalid choices. |
| D02 | AC03 | Start with a different meaningful draft, including name, biography, equipment and journey progress. Cancel the open. All data, step, completion/selection state, and stored draft remain unchanged. Repeat with the same character but newer local unsaved edits. |
| D03 | AC03 | Download backup from the replacement decision. Verify the full exported draft can be reimported. Download alone leaves the draft/dialog unchanged. Open the account character only after explicit replacement; the downloaded file is not reported as confirmed written by the browser. |
| D04 | AC03, AC10 | Reject/delay the query or return invalid data. No reset, cloud write, empty draft, or false loaded message. Cancel and backup remain usable. Serialization failure does not proceed automatically. |
| D05 | AC03, AC07 | Edit the draft while an open query or decision is pending. The earlier response cannot overwrite the newer edit without a fresh decision. Navigate to another character/campaign, remount, or reconnect: the old response cannot apply. |
| D06 | AC04 | Load existing record, edit, reload, then Save under the same identity. Update the same record with the old base revision. Character count stays unchanged. Repeat for all engines and their differing storage envelopes. |
| D07 | AC04, AC06 | Load N on A, edit and reload A; B saves N+1 before A resumes. A retains its exact local draft and base N. Revalidation does not attach N+1 to A's old content. A's Save conflicts and leaves B's copy unchanged. |
| D08 | AC04, AC09 | Restore legacy drafts or metadata with wrong owner/engine/record, mismatched persisted-draft fingerprint, malformed revision, or partially written sidecars. Keep valid local character data; do not guess a binding, autoattach by name, or update an existing cloud record. Separately verify that a valid dirty draft with different baseline and current-draft fingerprints retains its binding and old base revision. |
| D09 | AC07 | Submit snapshot S, then edit it to S2 before acknowledgement. Cloud contains S; editor retains S2 with an account-unsaved indication and the newly acknowledged base revision. The next deliberate save submits S2. |
| D10 | AC07 | Change character or sign out/switch identity while save is pending. A late acknowledgement cannot select the old record, change a new draft's baseline, or say the new account's character was saved. Verify both source and destination records. |
| D11 | AC06 | Trigger conflict. Keep this draft changes nothing; Download backup exports local content; Load account version fetches latest and requires the replacement decision. A further cloud change while choosing remains protected. No force overwrite or new-revision retry occurs. |
| D12 | AC07, AC10 | Double click Save on new and existing records. At most one independent UI operation is issued. Interrupt response delivery; show pending/unconfirmed status and retain draft. No automatic fresh create/retry is added after uncertainty. |
| D13 | AC03, AC07 | Simulate localStorage quota/write failure. Do not report Saved on this device. Retain in-memory work and offer backup. Partial metadata cannot later authorize an unsafe update. |
| D14 | AC11 | Sign out, sign into another account, and restore a draft. Existing device data is not silently deleted or uploaded. Trusted binding and prior private account query results are invalidated. Copying device work to the new account requires an explicit decision. |
| D15 | AC12 | Import a valid existing backup and start New character. Clear any old record binding; maintain normal confirm behavior and journey entry. Import forged ID/revision fields and verify they grant no account-write authority. |
| D16 | AC01, AC10 | Refresh the destination, go Back/Forward, and allow reactive query updates after local edits. Do not repeatedly reload the campaign snapshot or erase those edits. Conflicting `create` and `campaign` parameters require a safe explicit choice. |
| D17 | AC01, AC12 | Confirm Savage Worlds bridge is ready before a campaign load applies; its loaded character survives reload. Ordinary backup loading retains its existing behavior. D&D reference-tab remounts and Pathfinder journey sidecars retain valid draft identity or safely fall back to unbound state. |

Use the existing DOM/interaction coverage in `tests/workspace-ui.test.jsx`, `tests/character-interaction.test.jsx`, `tests/character-journey.test.jsx`, and `tests/character-backup.test.mjs`. Add shared-helper state tests where they verify a real race/invariant rather than mirror implementation details. Run the real editor adapters for load/save; a mocked button alone does not prove this feature.

## Existing flows and style checks

| ID | Acceptance | Scenario and required result |
| --- | --- | --- |
| F01 | AC12 | Complete each existing new-character journey without campaign parameters. Check first chapter, explicit choices, validation book, same-class preservation, Back/Continue, name/story, sheet, and account/manual Save. |
| F02 | AC12 | Round-trip existing editable backups in all engines; preserve complete nested spell, language, multiclass, feat, inventory, notes, and setting data. Verify New/import do not overwrite an old bound account record. |
| F03 | AC12 | Existing print/PDF and export controls remain reachable; no export serializer/data catalogue/rule change is introduced. If touched unexpectedly, document the dependency and run its directly relevant checks before claiming preservation. |
| F04 | AC13 | Compare campaign action, draft dialog, conflict dialog, and save status with the accepted existing UI in desktop light/dark and 390px/320px phone layouts. Preserve Alegreya, existing color tokens/art, and outlined/control treatment. No horizontal overflow or hidden action footer. |
| F05 | AC13 | Keyboard reaches Open/Back and every dialog action. Focus enters the decision, is trapped where appropriate, Escape chooses cancellation, and focus returns to the trigger. Visible Close/Back and status announcements work without color alone. |
| F06 | AC13 | Long character names and error messages wrap. Tap targets remain usable at phone widths; larger text and reduced-motion settings preserve readable status and decisions. |
| F07 | AC02, AC08 | A broken/stale campaign link remains on a recoverable error and never falls back to the first campaign or another library character. Return links remain on fixed internal routes. |

These are focused additions; do not turn this delivery into a broad visual redesign or audit of unrelated pages.

## Offline, installed-client, and rollout checks

| ID | Acceptance | Scenario and required result |
| --- | --- | --- |
| R01 | AC09, AC10 | With current app shells cached, go offline and open a campaign locator. Keep an existing device draft; report that loading the account character needs connection. Ordinary offline local creation and backup export still work. |
| R02 | AC10 | Inspect CacheStorage and network handling. Public shells/static assets may be cached; private character/campaign responses and snapshots must not be stored there. Confirm logs/diagnostic attachments contain no sheet/journal content. |
| R03 | AC09 | Run a pre-feature frontend against the protected backend. Loading/export/local editing remain usable. Existing-record Save is blocked with no mutation; old creates behave as specified. Verify all three old editors, not just the new shortcut. |
| R04 | AC09, AC12 | Run the new frontend against legacy rows. Confirm optional revision handling, exact backup shapes, and same-record reload/save behavior. New frontend against an unavailable old backend fails safely without falling back to unguarded Save. |
| R05 | AC09, AC10 | Build and load the candidate in a fresh browser, then test an already installed copy updating. Check loaded bundle/service-worker identity. Unsaved draft survives update/reload or is protected by a clear keep/download decision. New classic static files, if any, are packaged. |
| R06 | AC09 | Simulate backend deployed but frontend build/publish fails. Old-client updates remain blocked and drafts/export remain available. Verify rollback retains the protected backend and cannot silently restore unversioned updates. |
| R07 | AC01, AC07, AC13 | On a physical iPhone/Safari or installed iOS app, open the campaign character, cancel a draft decision, export a backup, edit/save, and reopen after backgrounding. Use a second independent browser/device to produce a real stale-save conflict. Record actual device/OS/browser; Chromium emulation does not satisfy this check. |

Physical-device access is a verification dependency, not a reason to stop independent implementation. If unavailable, report R07 as unverified and do not claim iPhone/installed-device proof. Production release checks and any real account writes require the separate implementation/release task's authorization.

## Commands and execution order

During implementation, record the baseline before changes and run focused tests as each layer is added. Existing public mutation callers/fixtures must be updated deliberately to the guarded contract while retaining meaningful negative validation coverage.

After the focused backend/editor checks pass:

```powershell
npm run check
npm test
npm run build
git diff --check
```

`npm run build` already includes `scripts/copy-static.mjs` and `scripts/verify-install-build.mjs`. Review existing classic-script/catalogue-size warnings separately from new failures. If new test files are added, ensure the test command actually includes them; do not leave a passing test outside the configured run.

Then exercise the built candidate in a real browser with production-style clean-URL redirects. At minimum, complete D01-D07, D09-D11, F04-F05, and R01/R03/R05 in the real-browser harness. Backend simulations remain necessary for the rest of the authorization/concurrency cases; a single-account click-through cannot replace them.

Run current VTT importer/network checks only if the implementation touches those export serializers or their output. Do not mutate unrelated accounts or invoke payments/support sends as part of this feature's regression pass.

## Release evidence and sign-off

An implementation report must contain:

- Tested commit/patch, intended files, and confirmation that unrelated `marketing/` work was preserved.
- Actual check/typecheck/test/build results and test counts from that run.
- B01-B10 results, three-engine draft/identity checks, and evidence from two independent sessions that the stale save did not alter the newer record.
- Before/after complete-payload comparisons for cancelled/failed opens, reload saves, conflicts, and backup round trips.
- Browser/layout/accessibility, installed-client compatibility, update/reload, and offline results with environments stated.
- Physical-device result or explicit unverified status; production checks separately identified if a release was authorized.
- Any remaining failures, their impact, and the compatible rollback action. Do not mark unrun checks as passed.

P0 logic and ownership checks must pass before enabling the new campaign shortcut. If a broader scenario cannot be executed, name it explicitly and keep any corresponding readiness claim provisional. There is no completed implementation or release sign-off in this planning document.
