# Savage Master UI research and discussion brief

October 2, 2026. Research with an owner-selected visual direction, now implemented locally in the shared appearance system, navigation, and workspace layouts.

## Objective and confirmed requirements

Make Savage Master inviting, readable, quick to use, and easy to learn for both players and Game Masters across supported games.

Confirmed by the owner during this research:

- Provide equally considered light and dark appearances.
- Automatically follow the device's appearance preference.
- Adapt the layout to phones, tablets, and desktops.
- Research first and discuss the direction before redesigning the application.
- Combine all three styles by workspace: Adventurer's Journal for player profiles and personal journals; Cinematic Fantasy for the Gaming Table and Chronicles community; Tactical Companion for GM tools and player character sheets.

Recommendation: offer **Follow device / Light / Dark**, defaulting to Follow device. A manual selection takes precedence until the user returns to Follow device. Let each device follow its own operating-system preference; a dark desktop need not force a light phone into dark mode. Theme and layout are independent: a phone may use either theme.

## Research method and limits

Reviewed the local application source, existing design notes, and the rendered Savage Worlds character creator and Master Builder entry screen. Reviewed primary product documentation from D&D Beyond, Owlbear Rodeo, Foundry, and Alchemy, plus usability guidance from Nielsen Norman Group and accessibility/performance references.

This is desk research and an initial local interface review. It includes no new player interviews, competitor task testing, measured production performance, or full accessibility audit. Product marketing demonstrates intended positioning, not independently proven ease of use. Recommendations below are design hypotheses to test with real players and GMs.

## What the research suggests

| Reference | Documented pattern | Proposed lesson for Savage Master |
|---|---|---|
| D&D Beyond | The Quickbuilder design article describes art-led choices, defaults, fewer beginner decisions, and optional customization. It distinguishes the shipped Quickbuilder from future builder concepts. | Start with an understandable hero concept and valid defaults. Let players expand rules detail when needed. |
| Owlbear Rodeo | Its getting-started guide gives players a link-and-join path and separates the GM's room/scene setup. | Make joining a table easier than preparing one. Avoid requiring a player to learn the GM workspace. |
| Foundry | Its tutorial separates systems, worlds, and modules; it explicitly acknowledges that its depth can overwhelm new GMs. | Keep clear campaign/system structure, but introduce advanced tools progressively. |
| Alchemy | Its product page emphasizes scene-based cinematic storytelling. | Use scenery and artwork to establish atmosphere while keeping readable interaction surfaces. |

Sources: [D&D Beyond design article](https://www.dndbeyond.com/posts/2135-behind-the-screen-the-new-quickbuilder-and-future), [Owlbear getting started](https://docs.owlbear.rodeo/docs/getting-started/), [Foundry GM tutorial](https://foundryvtt.com/article/tutorial/), [Alchemy](https://alchemyrpg.com/).

Nielsen Norman Group recommends showing common actions first and revealing specialized options when needed. Its recognition guidance favors visible choices over demanding that users remember terminology or commands. Applied here, character choices should describe what they do, and the next action should stay visible. Sources: [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [Recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/).

Visual appeal can improve perceived usability and can also mask real usability problems during testing. Judge success by completed tasks as well as appearance ratings. Source: [Aesthetic-usability effect](https://www.nngroup.com/articles/aesthetic-usability-effect/).

## Findings in the current project

### Strengths to retain

- Original illustrated hero kit, campaign tome, and memory journal already form a cohesive visual family.
- Antique gold, forest teal, leather, and parchment provide a recognizable identity.
- Character creation already has named steps, a progress indicator, explanatory text, and a live summary.
- World creation already begins with a rule foundation rather than silently assuming one game.
- Existing D&D Play View separates some session needs from character editing.
- Existing prototype work already explores device appearance, larger text, simple Table View, and an optional customizable Game Mat.

### Opportunities to address

- The rendered Savage Worlds desktop sidebar combines workspace navigation, product links, game switching, eleven creation steps, account controls, exports, backup tools, and help. Important actions extend below the initial viewport. Give each kind of navigation a clear place and reduce competition during creation.
- The character creator uses several independently scrolling columns. Keep the main task easy to follow; use a compact summary and avoid nested scrolling where possible.
- The brown/gold palette gives many elements similar visual weight. Use stronger hierarchy between page background, reading surfaces, labels, and the main action. Contrast still needs measurement before claiming compliance.
- Master Builder shows several upcoming tools before the available world workflow. A focused first-run path should bring the available task forward and place future tools in a secondary area.
- Workspace navigation varies between pages. Standardize location names, ordering, selected states, and the placement of account/appearance controls.
- The welcome screen has atmospheric sign-up/sign-in labels. Supporting copy or accessible names should make their destinations unambiguous while preserving its concise presentation.
- The sheet currently explains browser drafts and explicit account saving. Theme changes must preserve this distinction: “Saved on this device” is different from “Saved to your account.”

Scope caution: the current project supports Savage Worlds, D&D 5e, and a Pathfinder 2e preview. Custom world rules can be recorded, but do not automatically become playable character engines. The design should help people use each supported game without claiming universal rules automation. Distinguish Savage Pathfinder, a Savage Worlds setting, from Pathfinder Second Edition.

## Three visual directions to discuss

| Direction | Light appearance | Dark appearance | Where it fits | Tradeoff |
|---|---|---|---|---|
| **Adventurer's Journal** | Warm ivory, ink text, bronze details, forest teal | Warm charcoal, ivory text, antique gold, forest teal | Characters, campaign library, journals, onboarding | Heavy texture or ornate typography can reduce readability; keep them restrained. |
| **Cinematic Table** | Clear light panels beside atmospheric scene art | Deep neutral panels beside cinematic scenery | Campaign entry and scene presentation | Large artwork and movement require stricter loading and contrast control. |
| **Tactical Companion** | Quiet neutral surfaces, crisp labels, prominent totals | Quiet dark surfaces, crisp labels, prominent totals | Combat, spell/resource tracking, session reference | Can feel generic without the surrounding Savage Master identity. |

Owner-selected direction: use **Adventurer's Journal for player profiles and personal journals**, **Cinematic Fantasy for the Gaming Table and Chronicles**, and **Tactical Companion for GM workspaces and player sheets**. Connect these with one shared design system: consistent navigation, terminology, buttons, form behavior, save states, focus states, and responsive behavior.

The Gaming Table combines cinematic scenery with tactical character and GM panels where useful. Keep scenery behind or beside opaque reading surfaces so session controls remain clear. Chronicles should feel like a welcoming fantasy gathering place, with cinematic headers and community identity alongside readable stories and straightforward navigation. This treatment does not imply new chat, voice, video, or live multiplayer features. Profiles and journals can use illustrated covers and chapter details, with calm writing and reading areas. GM workspaces and sheets prioritize search, preparation, stats, actions, and resources while retaining restrained Savage Master visual cues.

All three treatments require complete light and dark appearances and Follow device behavior. Changing workspace must preserve the user's appearance preference. A change in visual atmosphere should never force users to relearn the interface.

Keep the existing literary heading style. Test the existing Alegreya body type at readable sizes before deciding whether dense controls need a simpler supporting font. Use decorative type and illustrations deliberately; avoid placing rules text over textured images. Gold is an accent whose text shade changes by theme, rather than the default color of every label.

## Proposed shared layout

Desktop: a compact workspace navigation rail, one primary task area, and an optional contextual panel. The current campaign and game edition remain visible in the header. Local creation steps belong beside or above the creation workflow; exports live in a clearly labeled action menu. Account and appearance controls have one consistent location.

Tablet: keep the primary task and one useful context panel when space permits. Collapse secondary navigation before reducing text sizes. Support both orientations and split-screen widths.

Phone: use a single main column, a small set of labeled navigation destinations, full-width task sheets, and a reachable primary action. Character totals become a compact sticky strip or an explicitly opened summary. Maps can pan and zoom inside their own viewer; the surrounding page should reflow. Provide an accessible location list alongside map interaction.

Choose layout transitions by available space and content, not by guessing the device model. Support touch and keyboard on hybrid devices. Resizing, rotation, and opening the mobile keyboard must not hide the active field or discard work.

## Player and GM journeys

### New player

1. Open an invitation, carrying the campaign's system, edition, and permitted options into setup. Without an invitation, choose a supported game with an explanation and an honest support label.
2. Choose a ready-to-play sample, a guided build, or a custom build. These are proposed entry options; sample characters and starter defaults need rule validation per game.
3. Make a small number of understandable choices at each step. Describe options with play examples and reveal full mechanics when requested.
4. Review a valid character, see where it is saved, and open Play View.
5. Show brief, contextual help for the first relevant action. Make help easy to reopen and skip.

Example supporting copy: “Hindrances are your hero's flaws. In Savage Worlds, they can give you points for additional choices.” Show the exact rules, limits, and remaining points nearby.

A shared layout does not mean identical mechanics. Savage Worlds needs dice, Bennies, Wounds, and conditions; D&D needs its own attacks, HP, concentration, and slots; Pathfinder 2e needs actions, proficiency, conditions, and its own spell/resource rules. Keep familiar placement while displaying the correct controls for the chosen game. Physical dice remain compatible with the project's established play direction.

### Game Master

1. Resume a campaign, or create one with a system and edition.
2. Prepare scenes, maps, party information, and references in a preparation workspace.
3. Open a focused session view showing tonight's scene, party, useful references, and quick notes.
4. Make the visibility of every shared scene, map, and handout explicit. Offer a player preview before sharing.
5. Capture a recap and choose what players can see.

“Preparation” and “Session” are task views within a campaign. A person may be a GM in one campaign and a player in another; permissions should follow campaign membership, not a permanent global role toggle. A visual Player Preview must not grant permissions or expose private content.

## Appearance and accessibility requirements

Device theme detection can use the browser's `prefers-color-scheme` support, which follows operating-system or browser appearance preferences. Source: [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme).

Proposed acceptance requirements:

- Apply the selected appearance before the first visible paint and respond to device theme changes while Follow device is active.
- Design backgrounds, surfaces, text, borders, input controls, focus states, selected states, errors, artwork, and dialogs for both themes. Do not implement light mode by inverting colors.
- Use a clean paper-like light appearance and readable warm dark surfaces. Keep textured decoration away from small text and form controls.
- Meet WCAG AA text contrast: normally at least 4.5:1, and 3:1 for qualifying large text. Source: [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Aim for about 44–48 CSS pixels for primary touch controls. This is a product target above WCAG 2.2's 24-by-24 minimum, which has specific exceptions. Source: [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Preserve visible keyboard focus, text enlargement, semantic labels, and alternatives to drag-only controls. Do not communicate selected, saved, or private states by color alone.
- Respect reduced-motion preferences; keep ambient motion optional. Start without autoplay sound.
- Print character sheets and handouts with a separate ink-conscious style, independent of the screen theme.

## Performance and reliability

Propose the standard “good” Core Web Vitals thresholds as release targets: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1, evaluated at the 75th percentile of visits, separately for mobile and desktop. These are targets, not measured results for Savage Master. Source: [web.dev Web Vitals](https://web.dev/articles/vitals).

Practical design consequences:

- Load the current sheet and essential controls first. Defer large catalogues, full-resolution maps, and optional scene media until needed.
- Keep small original artwork compressed and size it explicitly so content does not jump as it loads.
- Ensure rules searches and resource adjustments remain responsive with realistic character and campaign data.
- Keep save state readable: saving, saved locally, saved to account, and failed/retry. Do not silently imply synchronization.
- Make recovery part of the experience: undo common resource changes, preserve drafts when navigation fails, and make backup/download discoverable.
- Show clearly which session features require a connection. Existing local draft behavior does not establish full offline multiplayer support.

## How to validate before a broad redesign

Prototype a small set of real tasks in both themes: invitation/join, guided character creation, player Play View, and GM session preparation. Start with five new players and three GMs as a formative study, then test a revised round; this is a proposed recruitment size, not a statistical claim.

Observe whether participants can:

- Identify their game, edition, and next action without coaching.
- Join a campaign and find their character.
- Complete a valid starter build and explain a key choice.
- Find an attack or spell, adjust a resource, and undo a mistake.
- Determine whether their latest changes are saved locally or to an account.
- Prepare a scene and correctly predict what players will see.
- Complete the same tasks on a phone in either theme.

Record completion, time, wrong turns, requests for help, rules confusion, and save/visibility mistakes. Also ask whether the interface feels inviting and recognizably Savage Master. Test OS theme changes, manual overrides, refresh, narrow widths, rotation, zoom, keyboard navigation, and slower devices/connections.

## Selected direction and next discussion

The owner chose the mix of all three styles with distinct workspace assignments. The next design review should compare a player profile/journal, Gaming Table/Chronicles, and a GM workspace/player sheet, each in light and dark and at phone and desktop widths. Review the transitions between them to ensure they feel like one product. Detailed mockups and application changes remain future work following this research discussion.
