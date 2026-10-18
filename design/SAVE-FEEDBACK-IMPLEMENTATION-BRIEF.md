# D&D save feedback beside the Save button

Status: implemented and locally checked on October 18, 2026; release authorized afterward. This brief records the implementation checkpoint. See the [implementation and Safari investigation report](releases/2026-10-18-save-feedback.md) and Git history for publication.

## Problem and intended behavior

During the physical iPhone/Safari test, the user changed the existing D&D QA character from HP 5 to 6 and tapped Save character. The button briefly blinked; the user could not see a result. Independent account readback confirmed HP 6 was saved. Currently, Save character lives inside Draft tools & saved characters below the sheet, while CharacterEditorPanel renders the save status above the creation workshop.

Show the existing save result beside the button that triggered it, including progress, success, failure, and unsaved changes. Preserve the approved Gilded Storybook appearance, existing character flows, account binding, revision guards, and recovery dialogs. The user specifically asked that the user be able to see the save result.

## Smallest implementation

- Start with D&D's existing toolbar in `dnd-builder.jsx`. Derive its feedback from the existing editor state and `editor.message()`; do not add a second save operation or an independent success timer/state.
- Show visible progress while the editor is actually saving and retain the existing duplicate-submit protection. Show Saved to your account only when the current complete snapshot matches the acknowledged account baseline. A newer edit must immediately show Changes on this device.
- Place the result adjacent to Save character, wrapping below it at narrow widths. Keep the existing top status useful when Draft tools is collapsed. Avoid duplicate live-region announcements.
- Reuse existing typography, spacing, and status colors from `character-editor.css` / `dnd.css`. Keep conflict, account-switch, copy, and open decisions in the existing CharacterEditorPanel flow.
- Do not change backend functions, snapshot contents, revision handling, auto-save behavior, creation navigation, campaign membership, other game engines, or marketing files.

## Acceptance checks before release

1. At iPhone-sized widths, Save character, Saving to your account, and the final result are visible together without scrolling to the top; longer error text wraps without horizontal overflow.
2. A successful account save shows Saved to your account beside the control. An edit made while the request is in flight or after acknowledgment shows Changes on this device, not a stale success message.
3. Offline/authentication failures and revision conflicts never show success. The existing Keep, backup, and account-version recovery actions still work, and local edits survive.
4. The existing initial account-loading wording issue is kept separate; this placement change does not weaken readiness or identity checks.
5. Run the existing editor regression tests plus the normal project checks required for a frontend change. Verify visual placement in a real browser, then repeat the save-result check on physical iPhone/Safari after an authorized release.

The deployed physical stale-save scenario completed before this implementation, preserving its release-specific evidence. Keep all unrelated working-tree files untouched. Verify the new feedback on physical iPhone/Safari after an authorized frontend release.

## Physical verification follow-up

The deployed D&D phone scenario completed on the user's reported iPhone 17 Pro Max / iOS 27 in Safari. The newer HP 7 account copy survived the stale HP 2 save, explicit recovery showed HP 7, and cleanup restored HP 5 at revision 11. See `releases/2026-10-17-old-install-update-checks.md` for evidence and limits. The feedback placement is now implemented and locally checked; new physical Safari verification is pending release and device access.

Keep a separate investigation for the reported conflict dialog that stayed open after Download backup and Keep this draft. Do not treat moving save feedback as a fix for that symptom. Reproduce the native Safari download-confirmation-then-Keep sequence on the physical device, inspect the existing click/dialog/focus behavior, and verify that Keep and Close dismiss without writing, preserve the entire dirty draft and old revision, and do not reopen a decision without a new user action. Existing isolated Chrome reproduction closes correctly, so the Safari cause remains unestablished. The unexpectedly timed opening decision after reload/editing also needs characterization before changing that flow.

October 18 investigation: local Chrome checks also closed correctly above the 420px dialog-layout breakpoint, after backup URL revocation, with touch and keyboard activation, and with focus returning to the HP field. A delayed reload-verification experiment reproduced an opening prompt after a new edit while preserving the complete draft. This identifies a possible timing mechanism, not the proven cause of the physical Safari observations. Shared dialog, opening, backend, and revision behavior remain unchanged; details and limits are in the implementation report.

Later October 18 physical follow-up: once Safari's native download window was gone, Keep this draft closed the account-conflict warning and preserved HP 2. Explicit account recovery loaded HP 7. A subsequent Save unexpectedly offered to create a new account character; Keep cancelled that decision without losing the phone's HP 5 draft. The original QA record was independently read at HP 7/revision 12, restored through the ordinary desktop editor to HP 5/revision 13, and reopened on the phone at HP 5. The full recovery-and-update sequence passes locally; an injected metadata-storage failure can produce the copy prompt, but that failure was not observed on the phone. Neither unresolved cause is being called fixed. Phone testing was stopped rather than repeating the recovery loop. The new inline feedback still needs physical verification after an authorized release.
