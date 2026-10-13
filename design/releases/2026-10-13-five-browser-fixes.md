# Five browser fixes — October 13, 2026

Fixes the five issues reproduced in the desktop and phone audit:

- Offline navigation rebuilds redirected cached HTML responses without their redirect history. A fresh installation can open the homepage, all three character creators, and World Builder offline, including hosts that redirect `.html` URLs to clean routes. Existing cached shells are handled by the same fallback.
- Repairs 98 corrupted text fields in Savage Worlds Edges, Hindrances, Powers, and gear notes. Costs, IDs, prerequisites, ranks, dice fields, and all other structured catalogue data are unchanged. Ambiguous damaged clauses use concise summaries and direct readers to the core rules; this is a prose repair, not certification of the entire catalogue against a particular printing.
- The Bug accepts an ordinary tap on touch devices and stays beneath the finger until the click. Desktop hover invitation and the existing long press remain available; scrolling cancels the hold.
- The support page renders where its original page root appeared, keeping the legal footer below its content.
- Adds a 32-pixel browser favicon derived from the existing application icon, includes it in the static build and offline inventory, and supplies the favicon link on entry pages that lacked one.

## Validation

`npm run check`, `npm test`, and `npm run build` passed: 146 Vitest tests, 132 Node tests, 14 built entry pages, and 92 packaged offline assets. The build retains its existing classic-script and large-chunk warnings.

Native Python Playwright with Chrome 155 tested the production build behind a local server reproducing production clean-URL redirects. All 75 route/layout checks passed across desktop light/dark, 390-pixel phone light/dark, and 320-pixel phone light. All 17 interaction scenarios passed, including completed character creation in each game, draft restoration, world backup export/import, support downloads, menus, themes, and normal phone taps on the Bug. Favicon requests returned 200.

Fresh desktop and phone contexts loaded only the homepage online, waited for the service worker, and then opened home, Savage Worlds, D&D, Pathfinder, and World Builder offline: all 10 navigations passed. D&D species selection also worked offline. The initial cache still contained genuinely redirected responses, confirming that this exercised the reported failure rather than a previously warmed route.

Machine-readable evidence and screenshots are under ignored `output/webapp-fixes-2026-10-13/`. Earlier browser-harness failures were corrected selectors/helper scope; final results are combined from `production-local-regression.json` and `production-local-details.json`.

Phone coverage uses Chromium touch/viewport emulation. Physical iPhone/Safari, native installation, signed-in cloud saves, real email delivery, private campaign screens, and remote ticket submission were not exercised. No account data or remote forms were changed by these tests. Unrelated `marketing/` files were preserved.
