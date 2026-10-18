# Open my campaign character safely

Implementation brief, October 17, 2026. Prepared in the Project Planner and Architect role.

**Status at planning time:** planning complete; application implementation, deployment, and feature checks had not started. The user approved this feature direction and requested the brief and checks first.

**Implementation update, October 17:** implemented and checked locally after the user's subsequent authorization. See the [execution record and remaining release/device gates](releases/2026-10-17-campaign-character-safe-open.md). The design below preserves the original planning brief.

Companion document: [implementation and release checks](CAMPAIGN-CHARACTER-SAFE-OPEN-CHECKS.md).

## Outcome and scope

A signed-in campaign member can select **Open my character**, reach their own attached character in the correct existing game workspace, and return to the campaign. Opening does not silently discard a device draft. Saving does not silently replace a newer account copy.

Preserve Savage Master's Gilded Storybook presentation and the existing Savage Worlds, D&D, and Pathfinder creation journeys. Make the campaign shortcut and save safety work through the current editors. Keep manual account saving and existing editable backup formats.

The user authorized planning documentation in this step. This brief does not authorize a release, production account writes, or a dispatched handoff to another agent.

## Current evidence

Inspected checkout: `C:\Users\Mjbro\Desktop\Projects\Savagmaster`; HEAD `5849f49efdd302f66a0f76b4f8182f23c7f59313` on `feat/convex-character-accounts`. The initial working tree has unrelated untracked `marketing/` material and no tracked changes. No applicable `AGENTS.md` was found in the checked ancestor directories or project files.

| Current fact | Source and implication |
| --- | --- |
| Party controls link to a game's general workshop. | `campaigns.jsx`, `Party`, line 24. There is no direct action that opens the caller's attached cloud character. |
| Membership records already attach a character to a user and campaign. | `convex/schema.ts`, line 67; `convex/campaigns.ts`, `join`. Reuse this association instead of adding another character-selection system. |
| Campaign workspace queries enforce membership; character reads/writes enforce ownership. | `convex/campaigns.ts`, `access`; `convex/characters.ts`, `load` and `save`. Membership and GM status must continue to grant no private character-edit permission. |
| Character updates patch the whole snapshot with no expected revision. | `convex/characters.ts`, line 28; schema line 69. An older editor can replace a newer saved snapshot. This is a static finding, not a newly reproduced production incident. |
| Editor/cloud identity is not restored reliably after reload. | Savage Worlds `account.jsx` keeps `selectedId` in React state; `dnd-builder.jsx:33` explicitly resets the restored ID; `pathfinder.jsx:27` starts its ID at null. A reload can make an existing character's next Save create another record. |
| Each engine has its own existing draft and load adapter. | `app.js`, `account.jsx`, `dnd-builder.jsx`, and `pathfinder.jsx`. Preserve these boundaries and their validators. |
| Savage Worlds cloud loading currently returns to the beginning. | `app.js:4390`, `savageMasterBridge.loadBackup`. Add an explicit campaign-open destination without changing ordinary backup-import behavior. |
| Private API responses are excluded from the public service-worker cache. | `sw.js`. Preserve that boundary; campaign links do not make private records available offline. |
| Previous live tests verified account and three-system character round trips. | `design/releases/2026-10-12-account-cloud-verification.md`. Those results are historical evidence, not verification of this new feature. |

Read these constraints before implementation: [character journey](CHARACTER-CREATION-REVIEW.md), [approved art style](SAVAGE-MASTER-ART-STYLE.md), `typography.css`, `app-design.css`, `campaigns.css`, `savage-workshop.css`, and the existing backup/ownership tests.

## Goals and boundaries

Proposed measurable release goals:

- An eligible member reaches the exact attached character with one campaign action when already signed in and no draft decision is needed, in all three engines.
- Every stale-save test rejects the update and preserves both the newer cloud copy and the local draft.
- Every cancelled/failed open preserves the current draft's complete character payload and journey state.
- Reload followed by Save updates the same owned record; it does not create an unintended copy.
- Existing creation, import/export, rule validation, and game-specific choices pass their regression checks.

No latency or adoption baseline has been measured. Record open/save timing during testing; do not claim a retention improvement from this delivery. A later small-group trial can measure whether players resume the right character on their next session. No analytics service is needed for this slice.

Out of scope: new game rules, a new sheet/editor, character sharing or GM access to player sheets, changing membership management, automatic cloud autosave, offline account editing/synchronization, automatic conflict merging, force overwrite, revision-history browsing, a new homepage resume feature, turn tracking, Epic Rolls, recaps, pricing, and a general cleanup/refactor.

P1 follow-ups, separate from this delivery: save a conflicted draft as a deliberate new character, a visual change comparison, and a bounded device recovery-history feature. Preserve architecture options for these without building them now.

## User stories

- As a campaign player, I want to open the character I joined with so I can start playing without searching my library.
- As a player with another draft on this device, I want to keep or back up that work before deciding to replace it.
- As a player using two devices, I want a clear warning when my account copy changed so neither session's changes disappear silently.
- As a returning player, I want my editor to remember which owned record it represents so Save does not create an unintended duplicate.
- As a GM without an attached personal character, I want a clear explanation instead of accidentally opening a player's private character.

## Required behavior and acceptance criteria

All criteria below are P0. Test IDs and exact scenarios are in the companion checks.

| ID | Requirement and observable acceptance |
| --- | --- |
| AC01 | Show **Open my character** for the caller's valid attached character in the existing campaign party area, including Gaming Table and Prepare where Party is used. Open that exact owned character in its existing engine. Savage Pathfinder remains a Savage Worlds setting. |
| AC02 | Missing attachment, deleted record, missing campaign system, incompatible system, malformed ID, unavailable campaign, or missing membership produces a recoverable explanation. Do not choose another character, another campaign, or a starter draft as a substitute. A GM can open only their own attachment. |
| AC03 | Before replacing a meaningful local draft, offer **Keep this draft**, **Download backup**, and an explicit **Open [character name]** action with a replacement warning. Cancellation is the default. Downloading alone does not replace the draft. A failed read, validation, backup serialization, or cancelled dialog leaves existing character data and journey state intact. |
| AC04 | Preserve a loaded record's ID, owner binding, and base revision alongside its device draft across reload. Restore binding only for the same verified signed-in identity. Never obtain a fresh revision and attach it to older edited content. Legacy drafts without trusted metadata remain usable local drafts. |
| AC05 | Each protected save checks ownership and an expected integer revision in the same server mutation that writes the snapshot. Exactly one of two different updates based on the same revision succeeds. Successful creation starts at revision 1; a legacy row without a revision is read as revision 0. |
| AC06 | On conflict, retain local changes and the newer account record. Explain that the account copy changed and offer **Keep this draft**, **Download backup**, and **Load account version** using the same replacement guard. No automatic merge, silent retry with a new revision, or overwrite action. |
| AC07 | Distinguish account save acknowledgement from device persistence. If edits occur while a save is pending, acknowledgement applies only to the submitted snapshot; newer edits remain marked unsaved to the account. A late result must not change another character, draft, or signed-in account. |
| AC08 | Direct URLs and client-supplied IDs grant no access. The server verifies current campaign membership, attachment ownership, and system at open time. Opening writes nothing to the cloud. GM scenes, another member's snapshots, and private journals are not added to the campaign response. |
| AC09 | Existing rows, existing JSON backups, public `characters:load` snapshot shape, and normal local draft keys stay compatible. Old installed clients cannot perform unversioned updates after protection is enabled. A rollback must not re-enable unsafe updates. |
| AC10 | Network loss or unavailable account data never replaces a local draft or reports an account save as complete. Reconnection cannot replay an old open into an edited draft. Existing offline local creation/export continues; do not cache private snapshots in CacheStorage. |
| AC11 | Character identity and pending operations are cleared or invalidated on sign-out/account change. Retained existing local drafts are unbound, labeled as device work, and require an explicit save decision before being copied to another account. Do not purge existing local character drafts as a side effect of this feature. |
| AC12 | Keep current creation order, choice confirmation, prerequisites, spell/gear budgets, draft restoration, printing/export, and manual Save behavior. Normal `/create`, game routes, New character, and backup import do not acquire a campaign dependency. |
| AC13 | Reuse existing typography, forest teal/gold/parchment tokens, artwork, button treatments, and responsive layouts. Status is readable without color alone; keyboard focus, Escape/cancel, visible Close/Back, narrow phone layouts, light/dark modes, and reduced motion work. |

## Recommended architecture

### Resolve the association on the server

Extend `campaigns:workspace` with a separate caller-only `myCharacter` summary, not private fields on every Party member. Return only the caller's authorized attached ID, display name, and engine, or a specific unavailable state. A campaign owner is not automatically a party member with a character.

The button routes to an existing game page carrying only the campaign ID:

- Savage Worlds: `/?game=savage&campaign=<campaignId>`
- D&D: `/dnd?campaign=<campaignId>`
- Pathfinder 2e: `/pathfinder?campaign=<campaignId>`

Keep invitation tokens out of these links. Generate links from the known route map; do not accept arbitrary return URLs. **Back to campaign** returns to `/campaigns?campaign=<campaignId>&view=table`.

At the destination, an authenticated `characters:loadForEdit` query resolves the current attachment itself when `campaignId` is supplied. Check membership, record ownership, current attachment, and expected engine in that same read. The route parameter is a locator, never permission. If the association changes between displaying the campaign and opening the editor, use the current authorized association or stop safely; never trust the earlier summary as authorization.

Use one shared engine-classification rule. Prefer validated snapshot system markers with compatible legacy row markers; reject contradictory markers. `pathfinder2e` means the standalone Pathfinder engine; a Savage Worlds `setting: 'pathfinder'` does not. Preserve legacy Core SWADE/null-setting support. Protected updates must not change a record to another engine; creating a separate character remains the existing way to switch engines.

### Keep snapshots and revision metadata separate

Add optional server-owned `revision` to `characters`. Treat absence as 0, increment atomically after an accepted update, and keep `updatedAt` for display/sorting. Do not use timestamps as concurrency tokens. No bulk rewrite is needed for initial rollout.

Recommended additive interfaces; exact exported names may follow repository conventions, but these contracts must hold:

| Interface | Contract |
| --- | --- |
| `characters:editorIdentity({})` | Return the caller's own opaque owner scope, or null. Existing auth queries inspected here do not provide a reliable identity independent of public-profile setup. Do not use email as the storage identity. |
| `characters:loadForEdit({id?, campaignId?, expectedSystem})` | Require exactly one locator. Return `{id, ownerScope, system, revision, updatedAt, snapshot}` only after authorization and existing snapshot validation. A campaign locator resolves the caller's attachment in the query. A direct ID remains owner-only. |
| `characters:saveForEdit({id?, expectedRevision?, expectedOwnerScope, snapshot})` | Derive owner from authentication and require it to equal the owner scope captured when Save was selected. The supplied scope is a consistency guard, never authorization. Existing-record writes require the correct expected revision; new records require no existing-record locator and return revision 1. Return `{id, revision, updatedAt}` from the accepted write, not from a later query. |
| Existing `characters:load({id})` | Keep returning the raw editable snapshot for compatibility. It remains owner-only and does not supply a trusted edit revision. |
| Existing `characters:save` | Preserve old create behavior if needed. Reject all existing-record updates that bypass the protected contract, with a stable update-required error. There must be no second public mutation that silently patches character snapshots. |

Use structured error codes for conflict, sign-in/update required, engine mismatch, invalid snapshot, and unavailable record. Unauthorized/nonexistent record responses must not expose a different person's identity or data. UI converts codes into short ordinary language; do not render raw Convex traces.

Keep backup payloads at their existing version and engine-specific shape. Server ID, owner scope, revision, and campaign context are editor metadata, not portable authority inside a downloaded/imported character. Import and New character clear the binding. An imported backup must never overwrite an account record merely because it contains forged metadata.

An owner may still save their own character through the ordinary library after leaving a campaign. Campaign access controls the shortcut; it does not transfer or revoke ownership of a private character.

### Stage opening before applying it

1. Restore the existing device draft normally. Wait for confirmed authentication, server owner scope, and the game adapter to be ready.
2. Fetch and validate the target into temporary memory. Do not mutate the active draft, step/checklist, or trusted metadata while fetching.
3. Compare the current draft with its last confirmed account baseline using the same normalizations as serialization. Compare all saved fields, preserve array order, and ignore object-key ordering. Do not use name/HP alone to decide that a draft is unchanged. Meaningful unbound drafts are treated conservatively as local work.
4. Obtain the explicit replacement decision if local work would be replaced. The cloud fetch completing, a reactive query update, or a repeated mount is not that decision. A download can be initiated, but the app must not claim the browser wrote the file to disk.
5. Immediately before apply, verify request generation, signed-in identity, campaign target, and draft generation still match. Edits made during the fetch/dialog require reevaluation. Apply the validated character and its matching metadata together, then persist using the existing draft adapter.
6. Open the existing sheet/review destination: D&D and Pathfinder's Character sheet; Savage Worlds' existing `summary`/Review step. If normal existing validation requires repair, show the current creation-book/edit guidance rather than changing rules or inventing completed choices. Locate the Savage Worlds step by its ID, not a copied numeric index.
7. Mark the open request consumed. Refresh/reconnection/query updates cannot reapply the original snapshot over later edits. Reopening an edited same-character draft offers retaining it or explicitly loading the account copy.

Keep campaign context available for the return action. If `create=1` and `campaign` appear together, stop the campaign open with a clear choice; do not silently prioritize a new draft or reset work.

### Preserve draft identity without rewriting the creators

Add a small shared state/serialization helper used by thin adapters for the three editors. It can hold owner binding, record ID, base revision, normalized baseline fingerprint, operation generation, and account status. Keep rule calculations, choice state, chapter migrations, and editor rendering inside the existing engine modules.

Preserve these local draft formats/keys:

- Savage Worlds: `savage-master-character-v1` and its existing step/checklist envelope.
- D&D: `savage-master-dnd-draft-v1` and the version-4 journey envelope.
- Pathfinder: `smsheets-pathfinder-draft-v1` and the existing journey sidecars.

Metadata may be an optional envelope field or a narrowly scoped sidecar. Pick the least invasive adapter for each engine. Distinguish the last acknowledged account baseline fingerprint from the current persisted draft fingerprint: they normally differ when the player has unsaved edits. A sidecar's persisted-draft fingerprint must match the actual stored draft, while its base revision remains paired with the acknowledged baseline. A dirty draft is not itself a metadata mismatch. This coupling prevents partially written sidecars from falsely authorizing a newer revision. On storage failure or a genuine metadata mismatch, retain the working draft and downgrade to an untrusted local binding, rather than guessing a revision or claiming persistence succeeded.

On reload, revalidate the owner/record binding after auth settles. If the cloud revision advanced, keep the restored local content and old base revision until the player chooses how to proceed. Fetching current metadata must never make a stale draft appear current. Existing local drafts without metadata are not automatically attached by matching their name.

The existing Savage Worlds bridge is a classic-script boundary. Extend it with a narrow explicit campaign/editor adapter or load option. Preserve ordinary `loadBackup` semantics unless a directly required compatibility fix is separately documented. Ensure campaign-loaded data is written to local storage; its current bridge only rerenders. If a new runtime file is loaded as a classic static asset, include it in `scripts/copy-static.mjs` and offline asset verification. Bundled shared modules must remain compatible with both the React adapter and classic-script bridge; do not convert the whole creator to React.

### Saving and conflict recovery

Capture the submitted snapshot, its base revision, owner identity, and draft generation before invoking Save. Send the captured owner scope and check it against the authenticated server owner even on a new create; otherwise an auth change between click and submission could copy an old account's draft into the new account. Use the existing Convex client and one in-flight save per editor. Double click must not issue two independent creates. Do not add an automatic retry that creates a fresh request/record after an ambiguous result.

On acknowledgement, advance the bound revision only for that character/account and retain the submitted snapshot as the confirmed baseline. If the user edited while saving, those edits remain active and visibly unsaved to the account. If character/account context changed, ignore the stale UI result; the already committed old record may remain saved, but it cannot become the new editor's selection.

On conflict, retain the old base revision and all local content. A player can keep working locally, download that draft, or explicitly load the latest account copy. Loading latest must fetch again and use the replacement guard. Never update only the revision token, and never retry the old full snapshot against a new token. If a response cannot be confirmed, say **Could not confirm your account save. Your draft is still here.** A later explicit read can resolve the uncertainty without overwriting local work.

Recommended visible states: **Opening character**, **Changes on this device**, **Saving to your account**, **Saved to your account**, **Account copy changed**, and a plain connection/storage error. **Saved to your account** requires acknowledgement and no newer local edits. Device-save success requires actual storage-write success. Never add snapshots, notes, revision fingerprints, or identifiers to public URLs or diagnostic attachments.

## Affected components

| Component | Intended narrow change |
| --- | --- |
| `convex/schema.ts`, `convex/characters.ts` | Optional revision, identity and versioned load/save contracts, owner/system validation, legacy write guard. |
| `convex/campaigns.ts`, `campaigns.jsx` | Caller-only attachment summary, explicit open/empty states, links using existing routes. |
| `account.jsx`, `app.js` | Savage Worlds safe load/save adapter, ready-state coordination, trusted metadata, existing Review entry. |
| `dnd-builder.jsx` | Adapt saved-library and campaign loads, protected Save, reload binding and status; keep `dnd.jsx` wrapper changes minimal if required for entry handling. |
| `pathfinder.jsx` | Equivalent adapter preserving its separate character and journey stores. |
| Small shared helper(s) | State transitions, semantic fingerprinting, fixed route mapping, error mapping. Name only after implementation confirms module-boundary needs. |
| Existing CSS and build assets | Only scoped new action/status/dialog styling and packaging if needed. No global style replacement. |
| Existing backend, backup, UI, and interaction tests | Extend meaningful ownership, version, race, draft, and journey scenarios; keep original coverage. |

## Delivery sequence, compatibility, and recovery

1. **Baseline and failing scenarios.** Recheck Git status and preserve unrelated work. Capture current tests/build and reproduce the stale-update, reload-to-duplicate, and generic-campaign-link cases with synthetic data. Add behavior checks that demonstrate the requested protection.
2. **Backend contract.** Add optional revision and protected interfaces, legacy-row behavior, and caller-only campaign association. Test legacy API guards, ownership, engine classification, and concurrent writes. No bulk snapshot migration.
3. **Editor adapters.** Integrate protected load/save into all three current editors, including ordinary saved-library loads. Add binding persistence, race guards, draft decision, and visible status. The direct shortcut must not be the only path with safe saves.
4. **Campaign action and style.** Add Open my character and Back to campaign using existing controls. Finish missing/error states and accessible dialog behavior. Preserve normal create routes.
5. **Verification.** Run the companion checks, then the normal project check/test/build. Check the production build's static assets and update behavior. Record physical-device proof separately from emulation.
6. **Release, in a separately authorized implementation/release task.** Deploy compatible backend/schema before frontend, following the existing Vercel/Convex build order. The backend may temporarily block old-client updates rather than accept unsafe writes. Preserve old-client loads, backup downloads, local editing, and safe creates. Do not ship or advertise the new shortcut until all new editor adapters are present.

The legacy update block is an intentional compatibility tradeoff: old installed pages cannot safely update account records because they lack a revision. Updated clients show **Update the app before saving this character to your account. Your device draft is still here.** An old bundle may show its existing generic error instead; it still must not lose its draft or write the record. Check any reload/update path with unsaved edits before using it. A failed frontend build after backend deployment must leave safe, blocked old updates rather than reopening the unsafe path.

For rollback, retain the optional schema field and protected backend/legacy guard. Disable/remove only the campaign shortcut or revert to a known frontend that supports the protected contract. If no compatible frontend is available, keep existing-record cloud updates blocked while local editing/export remains available. Never deploy the pre-feature unguarded save handler as a convenience rollback. Recover user work through validated local backups and explicit loading; this slice introduces no full cloud history or automatic restore system.

## Decisions and tradeoffs

- **Recommended:** integer compare-and-save revision. Timestamps can collide and represent time, not edit ancestry; automatic last-write-wins recreates the data-loss risk.
- **Recommended:** additive metadata endpoints with a guarded legacy mutation. Changing the old load return shape would break existing consumers; leaving an unguarded legacy write would bypass protection.
- **Recommended:** reuse three editor adapters. A single rewritten editor or a broad shared-state refactor would put the approved journeys at unnecessary risk.
- **Recommended:** explicit keep/download/load-latest recovery. Automatic whole-character merges can combine incompatible equipment, class, spell, and point budgets. A force-overwrite control is unnecessary for this first slice.
- **Recommended:** campaign locator resolved server-side. A client-selected party member or a raw URL character ID cannot establish membership or ownership.

## Remaining decisions and completion evidence

No user decision blocks finishing this brief. The implementation owner should settle the precise helper filename, per-engine metadata storage choice, and native-versus-existing accessible dialog reuse during the first adapter trial. Keep those decisions within the contracts above; a broader rewrite needs a revised scope.

Planning completed by reading the selected role, live checkout source, project design documents, and existing tests. No application code, schema, accounts, deployment configuration, or unrelated marketing material was changed by planning. Checks below are specified, not claimed as passing. A later implementation report must record the actual commands/results, failure cases, tested commit, device/browser context, deployment identity if released, and any gates still unverified.

Planning-document checks: all 13 acceptance criteria have companion check coverage; the 41 check IDs are unique; local Markdown links resolve; code fences balance. Eight directly affected application files matched their pre-planning SHA-256 hashes, and Git status showed only the two new planning documents plus the pre-existing `marketing/` material. Application tests/builds were not run for this documentation-only step.
