# Campaign character opening and protected account saves

October 17, 2026. **Committed, pushed, and live at [smsheets.com](https://smsheets.com), with the production backend deployed first.**

This implements the [approved brief](../CAMPAIGN-CHARACTER-SAFE-OPEN-BRIEF.md) through the existing Savage Worlds, D&D, and Pathfinder editors. The [check plan](../CAMPAIGN-CHARACTER-SAFE-OPEN-CHECKS.md) remains the full scenario inventory; the evidence and limits below distinguish executed checks from release/device work.

## Result

- The campaign party area offers **Open my character** for the caller's valid owned attachment. The server resolves the current membership/attachment at the destination. The existing sheet/Review opens and provides **Back to campaign**. Invalid campaign links no longer silently select another campaign.
- Before replacing meaningful device work, the editor offers Keep this draft, Download backup, and an explicit Open action. Downloads do not replace the draft. Conflicts retain the local draft and offer the same guarded load-latest recovery.
- Account updates compare a server revision and the authenticated owner captured at Save. An older editor cannot replace a newer account snapshot. Legacy rows start at revision 0 without a bulk migration; new records start at 1. The legacy update endpoint fails closed, while raw loads and legacy creates keep their existing shapes.
- A sidecar preserves owner/record/base-revision identity across reload. Revalidation never refreshes only the token on older content. Edits made during a save remain unsaved locally after the submitted snapshot is acknowledged. Account switches, cancelled requests, New character, and imports invalidate the old operation/binding.
- All three creators retain their existing chapter order, calculations, choice controls, artwork, backup formats, print/export tools, and manual Save. New actions/status use the current Gilded Storybook tokens and typography. The Savage Worlds status/return controls live in the visible workshop; the shared native dialog stays outside its rerendered classic-script container.

The first save of an unbound device draft asks for an explicit copy into the current account. Validation runs before that decision, preserving existing missing-name/creation guidance. No automatic merge, force overwrite, cloud autosave, offline private-record cache, new game rule, or pricing behavior was added.

## Verification

| Check | Result and proof boundary |
| --- | --- |
| Baseline | Typecheck/build passed; 278 tests passed before implementation. Recovery copies initially matched the test discovery filter; renaming them to `.snapshot` removed that harness issue before recording the passing baseline. |
| Backend gate before editor work | 21 focused backend tests passed, followed by the full then-current 287-test suite and typecheck. New protection tests failed against the original backend first. |
| Final automated suite | `npm run check` passed. `npm test` passed: **162 Vitest + 146 Node tests = 308**. The new editor UI suite is explicitly included in the normal test command. |
| Production build | `npm run build` passed: **14 entry pages, 8 icons, 93 packaged offline assets**. Existing classic-script and large-Pathfinder-chunk warnings remain. |
| Focused browser checks | **39 passed** in headless Chrome using the actual editor modules, synthetic account hooks, and a shared compare-and-save fixture. Two independent browser storage contexts exercise newer-cloud/stale-device saves. Three-engine checks include complete local backup downloads, cancellation, reload revision retention, dark 320px dialogs, phone overflow, Escape/focus behavior, campaign route mapping, and invalid-link recovery. These are UI contract checks, not a live Convex-account test. |
| Built-site regression | **92 passed**: 80 desktop/phone/light/dark route/layout cases and 12 interaction cases covering navigation/auth entry, three creation journeys/reload, world backup import/export, and support/community. The historical harness initially used exact home-link names that omit the existing helper text; only the copied harness selectors were corrected. Application home copy was not changed. |
| Final built interaction rerun | **12 unique cases passed** after the last import/save protections. One D&D desktop rerun logged a resource connection refusal after completing the flow; isolated desktop and phone D&D rechecks passed without source changes. `final-interactions.json` combines the successful cases and identifies `flow-results.json` and `dnd-results.json`; the initial failure remains recorded. |
| Fresh offline startup | **10 navigations passed**, five each in desktop and phone contexts after initially loading only the homepage. D&D choice dialogs also work offline. The server reproduces clean-URL redirects, so initial cache entries include redirected HTML responses. |
| Live authenticated feature checks | **25 assertions passed** using independent existing Edge and Codex in-app browser profiles for the same owner. All three engines opened their owned campaign attachment, rejected a stale save, preserved the complete stale snapshot and base revision on reload, downloaded a complete backup, and explicitly loaded the unchanged newer account snapshot. |
| Live public checks | `/profile`, `/dnd`, `/pathfinder`, `/?game=savage`, and `/campaigns` returned **200**. Published D&D/Pathfinder bundles target production Convex. Anonymous editor identity is null, and anonymous campaign-character access returns `SIGN_IN_REQUIRED`. |
| Patch hygiene | `git diff --check` passed. No dependencies were added or upgraded. VTT serializers and rule catalogues were not changed. |

Backend tests cover lazy legacy revisions, competing same-revision writes, malformed revision guards, ownership and auth changes, engine boundaries including Savage Pathfinder, missing/deleted attachments, missing campaign system, revoked membership, raw-load compatibility, and rejection of legacy unversioned updates. Deterministic editor tests cover delayed responses, draft edits during loading/decisions/saves, partial metadata, offline requests, cancellation, double clicks, and verification completing after a different character opens. Actual adapter tests exercise all three creators and explicitly verify Savage Worlds backup imports clear any old account binding.

## Check-plan coverage and remaining gates

- **B01-B10:** backend ownership, attachment, validation, revision, and compatibility behavior is covered locally. Production backend configuration, owned campaign attachment resolution, competing saves, and account round trips additionally passed live checks for all three engines. Outsider access, malformed payloads, and revoked-membership permutations remain local backend test evidence.
- **D01-D17:** shared-state tests, seven real-adapter DOM tests, and focused browser checks cover the core draft/reload/conflict/race behavior. The production checks additionally cover dirty-draft Keep, competing saves across independent profiles, full conflict backups, old-revision retention on reload, and guarded recovery. Provider authentication transitions, delayed response ordering, and some storage failure cases retain deterministic local proof boundaries.
- **F01-F07:** existing creation/backups and route/layout behavior passed browser and automated regression checks. Existing print/export entry points remain; native print dialogs and running Foundry/Roll20 imports were not exercised. Long-name wrapping uses existing and scoped wrapping rules; a separate long-name physical-device measurement was not made.
- **R01-R02:** fresh offline navigation and existing static/API-cache exclusion tests pass. Private cloud data was not added to service-worker caching.
- **R03-R04:** legacy contract safety and optional-row compatibility pass backend tests. A real pre-feature installed client paired with the new production backend was not exercised.
- **R05:** fresh current-build install assets/precache work. Updating an already installed old version with a dirty account draft remains a release check.
- **R06:** the rollback contract is documented and the legacy write block is tested; an actual failed production deployment/rollback was not performed.
- **R07:** physical iPhone/Safari and installed iOS testing remains unverified. Phone coverage here is Chrome viewport/touch emulation.

The installed-client and physical-device cases above remain unverified. The production receipt below covers the executed live scenarios only.

## Production release and live evidence

- Feature commit: `9b6d89dbebdc34be41a7c9f90bb74f9e5c0715c8`, pushed to `feat/convex-character-accounts`. Its 21-file allowlist excludes marketing and ignored receipts.
- An extracted archive containing all **837 Git files** from that exact commit was verified before upload. Staged production deployment `dpl_Fu5wdbeoHZY5foknLVs6F9y8gGLu` ran the existing Vercel build pipeline and successfully deployed the optional schema and functions to `striped-jaguar-856` before the frontend was released. All five staged routes returned 200 before promotion.
- The subsequent Git deployment `dpl_8g1Eihs62xcyeVHNuG1Hq8NEc4Fn` is **READY** and serves `smsheets.com` and `www.smsheets.com`. Vercel metadata confirms the exact feature SHA; GitHub's Vercel status is successful. The published asset names match the staged build.
- Live checks used ordinary existing authenticated sessions in separate Edge and Codex browser profiles. No sessions or authentication keys were copied. Three new characters and three private campaigns are labeled `QA safe open <engine> 9b6d89d`; existing account characters and campaigns were left intact. The QA records remain available for inspection.
- D&D was tested in both save directions, advancing through revisions 1 to 4. Pathfinder and Savage Worlds each advanced from 1 to 2 while the other profile retained revision 1 and received the conflict decision. Complete downloaded stale snapshots were compared with the working draft for every engine; complete recovered cloud snapshots matched the newer profile's saved baseline.
- A browser-tool reset discarded the initial in-memory preservation copies during the first D&D download observation. The two original D&D drafts were recovered read-only from browser storage before proceeding. Durable, ignored preservation files were then saved. All **nine explicit non-authentication draft keys in each profile** were restored and compared exactly with those files at the end. Browser database files were not edited directly.
- Edge's automated download-event observer timed out. Complete live conflict downloads passed in the in-app browser for all three engines. An initial synthetic signup remained unverified when its email was unavailable; fresh signup/email delivery is not part of the passing feature evidence. No account passwords were changed.
- A Vercel runtime query scoped to the active deployment returned **0 error records** for the preceding hour. This is a Vercel log result, not an exhaustive Convex log audit.

Ignored live receipts include `live-deployment-receipt.json`, `live-public-results.json`, `live-cua-results.json`, three conflict screenshots, three complete synthetic stale backups, and private device-draft preservation files. Private preservation contents and authentication data are excluded from Git and deployment uploads.

## Preservation and local evidence

Starting HEAD: `5849f49efdd302f66a0f76b4f8182f23c7f59313`, branch `feat/convex-character-accounts`.

Ignored receipt directory: `output/campaign-character-safe-open-2026-10-17/`. It contains baseline hashes for 848 files, starting Git status, `.snapshot` recovery copies, pre-fix/focused/final test logs, candidate hashes, browser fixtures/results/screenshots, built regression results, offline results, and the live receipts listed above. Test fixtures contain synthetic characters. Private device preservation files remain local and ignored.

Eleven pre-existing source/test/config files were intentionally changed. New runtime helpers/styles and tests are limited to this feature. All other tracked baseline files remain unchanged. The two planning documents receive only an implementation-status link to this report.

One unrelated baseline file, `marketing/social/facebook-release-log.json`, changed concurrently during implementation (observed modification time `2026-10-17T23:17:58.9014220Z`). Its changed contents were retained outside the feature. The release-start hashes of all **19 marketing files** remained unchanged through live verification. Marketing was excluded from both the feature commit and the verified deployment archive. The authorized release created only the clearly labeled QA records described above; no public post, payment, or support send was performed.

## Deployment and recovery

The compatible schema/backend was deployed before the frontend using the existing Vercel/Convex build order. Old installed editors may temporarily show their existing save error; their unversioned updates must remain blocked. Their local drafts and raw backup/export tools remain available.

For rollback, keep the optional revision schema and protected backend. Disable the shortcut or use a frontend that understands the protected interfaces; never restore the original unguarded existing-record mutation. No full account revision-history restore was introduced. Recover individual device work through validated editable backups and an explicit load decision. Use the saved recovery copies only for specifically reviewed local files; preserve the concurrent marketing work.
