# Preserve the account link when browser storage fails

October 18, 2026. Authorized scope: investigate and fix the unexpected **Save this device draft?** prompt locally, retain the existing style and character flows, preserve unrelated work, and run checks before another phone test. No release is authorized by this request.

Status: implemented and checked locally; release authorized afterward on October 18, 2026. See the [results and limits](releases/2026-10-18-character-account-link.md) and Git history for publication. This brief records the implementation checkpoint.

## Finding and intended behavior

The existing shared editor discards its in-memory account binding when writing its local metadata fails. The D&D and Pathfinder adapters also discard that binding when their local draft/journey writes fail. After an explicit account opening, either failure can therefore turn the next Save into the new-character confirmation. The metadata-write path was reproduced in isolated Chrome during the prior investigation. The physical Safari cause remains unproven.

Local caching does not establish the account identity: the loaded record, authenticated owner, and acknowledged revision do. A failed cache write must preserve that already-verified binding and complete working character. Save must still use the same record ID, expected owner, and last acknowledged revision. Any newer account revision must still reject the stale save. Keep the existing storage warning so a user knows to save to the account or download a backup before leaving the page.

## Narrow implementation

- In `character-editor.mjs`, keep the current binding when metadata persistence throws. Preserve the existing warning. Do not change restoration validation, backend functions, revision updates, account switching, explicit new/import detachment, portable backup contents, or dialog actions.
- In `dnd-builder.jsx` and `pathfinder.jsx`, keep the current binding when local draft/journey persistence throws. Retain the existing warning and working state. Keep the already implemented save-feedback UI and all styles unchanged.
- Add focused editor and actual-adapter regressions demonstrating the failure before the patch. Test account recovery followed by a failed cache write, subsequent same-record saving, storage-failure plus stale revision, and explicit detachment even while storage is failing. Use isolated browser contexts with synthetic authentication and blocked remote backend requests.

## Acceptance and validation

1. After opening/recovering an account character and a failed local draft or metadata write, Save updates that same record with its acknowledged revision, without the new-copy prompt.
2. Failures retain the complete working snapshot, show a storage warning, and allow a complete backup. An acknowledged account save never implies that failed device storage succeeded.
3. A newer account save still produces the conflict decision; Keep preserves local work and explicit recovery remains guarded. New/imported drafts and actual owner changes still detach and require their existing decisions.
4. Run focused tests before and after, the normal typecheck/test/build checks, and an isolated real-browser replay of recovery, storage failures, save/conflict, and backup. Keep Chrome evidence separate from physical Safari proof. Preserve baseline hashes of all pre-existing work, especially marketing and the previous save-feedback patch.

Browser storage that refuses writes cannot guarantee retention of new local edits across a reload. This patch preserves the verified link within the active editor session and retains the warning; it must not guess a record from a name or bypass the existing restored-binding checks.
