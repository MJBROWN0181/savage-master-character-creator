# Savage Master app installation

Public install link: https://smsheets.com/install. The landing page and every workspace's Explore menu include an Install App action. The Savage Worlds sidebar uses the same shared action.

This follows the installed-web-app pattern used by MySeptic: the browser installs the live website as a standalone app with its own icon and window. No separate executable, app-store listing, or second game implementation is needed.

`app-install.js` captures the browser install event before workspace rendering. One ordinary click invokes the native prompt immediately when it is available; the player confirms installation in the browser. Without a prompt, the link opens a short guide for computers, Android, or iPhone/iPad. Cancellation consumes that prompt safely, duplicate clicks are ignored while it is open, and blocked installation falls back to the guide. Installed app windows hide redundant install actions. A browser tab is not assumed installed based on a saved flag.

`install-vite-plugin.mjs` adds the shared installer, manifest, and Apple icon to every entry. The existing branded icons keep their original appearance and use `purpose: any`; they are not advertised as padded maskable images. The manifest has a stable root ID/scope and shortcuts for character creation and Around the Fire.

The production service worker precaches all workspace HTML, JavaScript, CSS, rule chunks, fonts, and install icons. It resolves clean routes and query-bearing game URLs offline. Card artwork is cached as used. Private API responses and public post permalinks/previews bypass caching, so withdrawn posts are not served from a stale offline copy. Sign-in, account synchronization, and community features require internet. Vite source development skips registration; offline support is verified against the built worker.

## Verification

- `node --test tests/app-install.test.mjs tests/app-offline.test.mjs` exercises prompt capture/acceptance/cancellation/failure, duplicate clicks, device detection, installed state, entry-page registration, offline game routes, private-response exclusions, and cache cleanup.
- `npm run check`, `npm test`, and `npm run build` cover the wider project.
- `node scripts/verify-install-build.mjs` checks every production entry, manifest icon dimensions, and all precache asset paths, including lazy rule chunks.
- Browser checks passed for the landing/install link, device guides, light/dark themes, and 375px phone fit. With the isolated built-app server stopped, Savage Worlds, D&D, and Pathfinder all opened their separate creation screens through the service worker. Native OS installation and physical iPhone/Android installation are not performed on the user's devices during development.
- Full validation passed: 243 tests (115 Vitest, 128 Node), type check, production build, and 82 available offline asset paths across 12 entry pages.

## Platform references

- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [Apple: Home Screen web apps](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iphea86e5236/ios)
- [Apple: Safari web apps on Mac](https://support.apple.com/en-us/104996)
- [Microsoft: Install apps in Edge](https://support.microsoft.com/en-us/edge/install-manage-or-uninstall-apps-in-microsoft-edge)
