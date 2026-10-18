# Account link retained after browser-storage failure

October 18, 2026. Local follow-up to the [implementation brief](../CHARACTER-ACCOUNT-LINK-IMPLEMENTATION-BRIEF.md), starting from HEAD `31cb8ee8c729c41017a466ac22ad2213588a5151` and the existing uncommitted save-feedback work.

## Result and cause

A reproduced cause of **Save this device draft?** is fixed locally. After opening or recovering an existing account character, a failed browser cache write cleared its verified in-memory account binding. The next Save therefore offered to create a new character. This happened in the shared metadata persistence catch and the D&D/Pathfinder draft-persistence catches.

Those catches now retain the known record ID, authenticated owner, baseline, and acknowledged revision. They still show the existing storage warning. Save updates the same account record through the existing guarded mutation; a newer account revision still rejects the stale save. No target is inferred from a name, and no revision is silently refreshed.

The application change removes the three cache-error assignments that cleared the binding, with one explanatory comment. Existing styles, dialog actions, explicit New/import detachment, account-change detachment, restoration validation, backend contracts, snapshots, and routes are unchanged. The previously implemented inline save-feedback change remains in place.

## Validation

| Check | Result |
| --- | --- |
| New regressions against pre-fix source | 3 editor cases and 5 actual-adapter cases failed at lost binding/new-copy behavior |
| Focused editor tests after fix | 18 passed |
| Actual-adapter tests after fix, including backup-import guard | 18 passed in the normal suite |
| `npm run check` | Passed |
| `npm test` | 173 Vitest across 28 files + 150 Node = **323 passed** |
| `npm run build` | Passed; 14 entry pages, 8 icons, 93 offline assets verified |
| Installed Chrome, actual adapters with synthetic authentication | **8 cases / 108 assertion groups**, zero captured runtime errors |
| `git diff --check` | Passed |

The browser replay covered D&D metadata and draft failures, both quota and storage-security exceptions, Pathfinder metadata/draft/journey failures, and Savage Worlds metadata/draft failures. Each case exercised stale-save rejection, complete backup equality, Keep, reload and explicit account recovery, a cache failure, same-record saving, a later concurrent account change, rejection using the previous acknowledged revision, another complete backup, and guarded recovery followed by normal saving. Phone-sized light/dark layouts were inspected; this is Chrome coverage, not physical Safari proof.

Additional regressions ensure explicit New and owner changes still detach while storage is failing, and a D&D backup import still requires the existing new-copy confirmation. The existing Savage Worlds import-detachment and other adapter/reload checks also pass. Existing classic-script bundling and large-chunk build warnings remain.

## Limits and preservation

The physical iPhone's original storage failure was not observed directly. This fixes a deterministic local failure path producing the same prompt; it does not establish the original Safari cause or prove the phone is fixed. If a browser refuses to retain data, the active editor can retain its account link and save to the account, but new local edits cannot be guaranteed across a reload. The existing warning and backup flow remain necessary. Restoration still validates the full cached draft and rechecks the account record.

Before this change, 860 tracked/non-ignored files were hashed and relevant files copied as non-test `.snapshot` artifacts. Only `character-editor.mjs`, `dnd-builder.jsx`, `pathfinder.jsx`, and the two editor test files differ among those baseline files. All other baseline files, including all 19 marketing files, the earlier release reports, save-feedback brief, and `dnd.css`, match byte-for-byte. The existing portions of both test files and the D&D inline feedback markup were preserved.

At this implementation checkpoint, all browser work used isolated synthetic contexts with remote Convex requests blocked. Existing authenticated browser profiles and production characters were not touched, and no commit, push, deployment, or further phone test had been performed. The user subsequently authorized committing and releasing the fixes. The temporary Vite process was stopped and port 5196 verified without a listener.

An unrelated untracked `research_notes/` folder appeared during the session; it was left untouched and is listed separately in the final receipt.

Evidence is ignored under `output/character-account-link-2026-10-18/`: starting hashes/status and `.snapshot` copies, pre-fix failure logs, post-fix test/typecheck/build logs, `browser-results.json`, screenshots, `preservation-result.json`, and `checks.json`.
