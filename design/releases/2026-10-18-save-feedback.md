# D&D save feedback and Safari dismissal investigation

October 18, 2026. Local patch on `feat/convex-character-accounts`, starting HEAD `31cb8ee8c729c41017a466ac22ad2213588a5151`. The user authorized implementing the [save-feedback brief](../SAVE-FEEDBACK-IMPLEMENTATION-BRIEF.md), investigating Safari's Keep issue, preserving existing style/flows and unrelated work, and running checks.

**Implementation checkpoint:** the D&D Save button now has visible progress/result feedback beside it. Local checks pass. A subsequent physical Safari check closed Keep this draft after Safari's native download window was dismissed; the earlier dismissal failure is not being called fixed. An unexpected new-character save prompt remained unexplained at that checkpoint; the later [account-link fix](2026-10-18-character-account-link.md) addresses a reproduced cause. The named production QA character was exercised and restored to HP 5, revision 13. The user subsequently authorized committing and releasing these fixes; this report retains the earlier implementation and physical-test evidence.

## Implementation

- `dnd-builder.jsx`: group the existing Save character control with `editor.message()`. The result stays beside Save on wider layouts and wraps below it on narrow phones. Its text is persistent rather than a timed toast.
- `dnd.css`: use the existing text token and control styling, with a wrapping group and bounded text width. New character, backup/import, creation navigation, and print controls retain their existing actions and order.
- Save progress, acknowledged success, unsaved changes, offline/request failure, and stale-revision messages come from the same editor state as the existing top status. An edit made during a save remains unsaved after acknowledgment of the earlier snapshot.
- Save describes the nearby message through `aria-describedby`. The top status retains the existing live announcement; the inline copy is not another live region.
- `tests/character-editor-ui.test.jsx`: four new behavior cases cover pending/acknowledged saves, duplicate activation while disabled, edits made during a request, and offline/request/conflict failures retaining the complete dirty draft and old revision.

No backend, shared editor/dialog lifecycle, snapshot, identity/revision contract, auto-save behavior, other engine, dependency, or design-token change was made.

## Checks

| Check | Result |
| --- | --- |
| Focused adapter UI baseline | 7 passed before edits |
| Focused adapter UI after implementation | 11 passed |
| TypeScript (`npm run check`) | Passed |
| Normal suite (`npm test`) | 166 Vitest tests across 28 files + 146 Node tests = **312 passed** |
| Production build (`npm run build`) | Passed, including install verification: 14 entry pages, 8 icons, 93 offline assets |
| Actual editor modules in isolated Chrome | 8 viewport/theme cases; 80 assertion groups; no captured runtime errors |
| Targeted dialog/timing investigation | 4 diagnostic cases passed; Safari cause not established |
| UI static review | No new findings; one existing hardcoded print-color note at `dnd.css:3` retained |
| Patch hygiene | `git diff --check` passed |

Browser cases covered light/dark 320×568, 390×844, and 440×956, plus light 768×1024 and dark 1440×1000. They verified that Save and its progress/result fit together in the viewport, long failure text wraps without horizontal overflow, current edits are not falsely marked saved, complete conflict backups match working characters, and Keep/Close preserve complete drafts and the old revision. The 440px cases cover the dialog's action-row layout above its 420px breakpoint; this is layout coverage, not a claim of an exact physical device viewport.

The initial full-suite attempt discovered a test backup in the ignored preservation directory. That backup's `.test.jsx` filename caused a copied-suite import failure; the 166 real Vitest cases had passed. The backup was renamed `.snapshot`, the backup helper was corrected, and the normal suite was rerun successfully. The initial failure log remains in ignored evidence. No application fix was needed for that test-discovery issue.

Existing classic-script and large-chunk build warnings remain. Rule catalogues and VTT serializers were not changed.

## Safari investigation

The historical physical symptom is specific: after a real stale-save conflict and Safari's native JSON-download confirmation, the user reported that Keep this draft left **Your account copy changed** open. That observation is retained as a failure; a Chrome pass is not substituted for it.

Source inspection confirmed that Keep and Close call the same non-writing `editor.cancel()` handler. It clears the decision while preserving the dirty snapshot and old binding. The React panel subsequently uses native `dialog.close()` and restores focus. Download exports a snapshot and schedules URL revocation without changing the decision or binding.

New isolated diagnostic conditions used the actual current React editor modules with synthetic authenticated account hooks and blocked remote Convex traffic:

1. At 440px width, touch Keep after backup download and after the one-second URL revocation had actually executed closed the conflict and retained the complete draft, old revision, and newer account HP 7.
2. Preventing the Save pointer activation from taking focus exercised return to the number input. Keep still closed and retained the same data.
3. Keyboard Enter on Save and Keep also closed without changing the dirty draft or old revision.
4. Holding the initial binding-verification request after reload, editing HP before it completed, then resolving verification and the following campaign load reproduced an opening decision **after the edit**, without any newer account save. Keep retained the complete edited draft. This demonstrates a possible mechanism for the previously surprising opening-prompt timing; it does not prove that the physical Safari event followed this exact sequence.

Keep also closed normally after download across all eight viewport/theme cases. Ignored traces capture pointer/click/focus observations. They are local diagnostic evidence, not an exhaustive physical Safari event trace.

The existing native show/close approach matches [WebKit's dialog guidance](https://webkit.org/blog/12209/introducing-the-dialog-element/). A [WebKit focus-restoration issue](https://bugs.webkit.org/show_bug.cgi?id=321623) was reviewed, but its conditional focus behavior does not establish the cause of this modal dismissal report. No browser bug is being attributed to the user's device from these sources.

Safari/WebKit was not available in the existing local test runtime. A subsequent physical Safari follow-up is recorded below. The exact iOS minor/build is still unknown. Do not call the earlier issue fixed or replace the guarded dialog flow based on an unconfirmed cause.

## Physical Safari follow-up on the current live app

The user operated Safari on the previously reported iPhone 17 Pro Max / iOS 27. This tested the existing live editor; the new inline save feedback is still local.

1. The phone opened the QA campaign character at HP 5 and changed Current HP to 2 without saving. A fresh authenticated desktop load independently confirmed the original QA record at HP 5, revision 11.
2. The desktop saved only Current HP 7 through the ordinary editor. The account acknowledgment returned revision 12. The phone's Save character attempt then showed **Your account copy changed**.
3. The user reported completing the JSON backup download. When asked about Keep, the user clarified that Safari's download window disappeared while the account warning remained. After an explicit instruction to tap Keep in the remaining account warning, the user confirmed that it closed and HP 2 remained. This distinguishes the two windows in this run; it does not establish which earlier taps reached the webpage or prove a Safari event-handling cause. The downloaded phone file's contents were not inspected.
4. Refresh showed **Open QA safe open dnd5e 9b6d89d?**. Explicit Open loaded HP 7, as reported by the user.
5. During cleanup, the phone changed HP to 5. Save unexpectedly showed **Save this device draft?**. That is the existing confirmation for creating a new account character when the editor has no current binding. The user tapped Keep and confirmed the prompt closed with HP 5 preserved. No new-character confirmation was instructed or reported.
6. A separate fresh desktop campaign load still returned the original QA record at HP 7, revision 12, confirming that the stale-save attempt and cancelled copy decision had not overwritten it. The desktop restored only Current HP 5 and received the account acknowledgment at revision 13.
7. The phone returned to the campaign, chose Open my character, accepted the replacement guard, and reported HP 5. A further repeated save check was stopped after the user pointed out that the walkthrough felt like a loop. The later terse reply does not establish a second occurrence of the copy prompt. No further phone testing is required for this investigation report.

The physical check confirms stale-save rejection, preservation of HP 2 when Keep closed, explicit recovery of the newer HP 7, and final reopening at HP 5. Complete backup equality and binding metadata are supported by local checks, not by inspection on the phone. The cause of the unexpected copy prompt and the original intermittent Keep symptom remain unestablished.

## Follow-up investigation of the copy prompt

An additional isolated Chrome replay used the actual editor modules, synthetic authenticated hooks, blocked remote Convex traffic, and the complete sequence: HP 5 -> unsaved HP 2 -> newer account HP 7 -> rejected save -> backup -> Keep -> reload -> explicit account Open -> edit HP 5 -> Save. It retained the complete backup/draft, recovered the same record and revision, and updated that record without a create prompt.

A separate positive diagnostic control deliberately made the editor metadata write throw a storage-quota exception after recovery. The current code then showed its browser-storage warning, preserved the working character, and required **Save this device draft?** on the next save. Cancelling preserved HP 5 without writing a new character. This injected condition demonstrates one route to the observed wording; storage failure was **not observed on the iPhone**, so it is not being diagnosed as the cause.

Both cases completed with zero captured runtime errors. The directly connected adapter UI tests (11) and editor tests (14) were rerun successfully. Shared editor, storage, identity, revision, and dialog source remain unchanged. A future fix needs evidence showing how the phone's account binding becomes absent before Save; inferring a target from a character name or silently refreshing its revision would weaken the existing protections.

## Preservation and production boundary

Before edits, 859 tracked/non-ignored files were hashed, including all 19 marketing files. Intended baseline-file changes are limited to `dnd-builder.jsx`, `dnd.css`, `tests/character-editor-ui.test.jsx`, and the save-feedback brief. The existing handoff, prior release/check documentation, and unrelated work were preserved. Baseline copies and hash receipts are ignored under `output/save-feedback-2026-10-18/`.

The final follow-up hash check detected one unrelated difference: `marketing/social/facebook-release-log.json` had a newer `lastCheckedAt` timestamp than the starting snapshot. Its remaining JSON content and the other 18 marketing files matched the baseline. This task did not edit or restore that log; the newer current file was preserved. The strict baseline check records the difference rather than claiming every marketing byte stayed unchanged.

The implementation's browser checks used isolated contexts and synthetic characters. The later authorized physical follow-up used only QA campaign `k972br7rqeg62ywnw5hwn2z3x58ggvtr` and QA character `jx7d7j4jkwk5saq28a6wxesarh8ggqgs`. Its two ordinary desktop saves advanced revision 11 -> 12 at HP 7 and 12 -> 13 at restored HP 5. Before each desktop operation, all nine named non-auth draft/journey keys were saved durably; after unmounting the character editor, each was restored and verified byte-for-byte. Both temporary authenticated test tabs were closed. No credentials/session keys were copied.

Anonymous public checks confirmed that the production D&D route still serves the earlier entry bundle, without the new inline feedback, and its service worker is byte-identical to the previous live mirror (`savage-master-6148763f82e9`). This implementation is local, not live.

The temporary local test servers were stopped after testing. Final preservation and Git hygiene results are saved alongside `browser-results.json`, `dialog-investigation-results.json`, `recovery-binding-probe-results.json`, `live-baseline.json`, full-suite/build logs, and phone-sized screenshots. Physical follow-up receipts, desktop save/readback screenshots, and both nine-key preservation receipts are under `output/save-feedback-2026-10-18/iphone-repeat-1792335357944/`.
