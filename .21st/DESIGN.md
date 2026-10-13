# Savage Master frontend refinement

Owner direction: keep our style; work across the app one page at a time.

## Visual foundation

Retain the Gilded Storybook identity documented in `design/SAVAGE-MASTER-ART-STYLE.md`: original etched ink-and-watercolor illustrations, forest teal, antique gold, parchment, and worn leather. Profiles and journals use Adventurer's Journal, community and table scenes use Cinematic Fantasy, and character/GM tools use Tactical Companion, as selected in `design/UI-DESIGN-RESEARCH.md`.

Reuse `app-design.css`, `typography.css`, `appearance.js`, and the shared workspace shell. Core palette: forest #111d20, parchment #f5f0e6, paper #fffdf8, ink #263d3e, antique gold #e4be7b in dark appearance and #825b24 in light appearance. Alegreya handles headings and body text; keep supporting controls legible.

## Step 1: homepage

Keep a centered welcome rather than add a feature grid or another illustration. The existing crest is the memorable element. Center the text and actions; preserve the familiar account entry wording with explicit descriptions of each destination.

```text
Brand                                      Settings

                     Crest
        Your character. Your table. Your story.
                 Brief description

        Begin Your Adventure | Already On One
          Create an account  | Sign in to your account

                Create a character
                    Install App
```

On phones, stack account actions. Keep the header clear of the crest. Use themed outlines, minimum 44px touch targets, and the shared focus treatment. Keep the original account, character chooser, and installation destinations.

Review against the brief: the catalog's centered welcome pattern fits, but its generic badge, tour, split-screen auth layout, and new imagery do not add value here. Reuse the existing logo and controls instead. Keep the story slogan intact; add only an explanatory sentence and account action descriptions. No new motion or packages.

Also correct the homepage skip link to reach its visible main content rather than the hidden Savage Worlds editor.

## Subsequent order

Character chooser; Savage Worlds workshop; D&D workshop; Pathfinder preview; profile and onboarding; campaign library; Gaming Table; journals; World Builder; Chronicles; settings; install; support; pricing and legal. Complete and review each independently. Keep rules, saved data, permissions, and billing behavior intact during visual work.

## Validation

Completed locally: 14 existing profile/workspace tests and 4 appearance tests pass. Production build and TypeScript check pass. Browser checked at 1440x1000, 390x844, and 320x568; no horizontal overflow, header overlap, or touch targets below 44px. Both light and dark appearances reviewed. Keyboard skip focuses the visible homepage. All four entry links reach their intended screens. Fresh-page console check has no errors. 21st review reports no findings for home.jsx, home.css, or workspace-shell.js; its shared CSS notes concern existing token declarations. Build retains existing classic-script and large-chunk warnings. Screenshots saved in ignored `output/playwright/homepage-refinement/`. Verification for this step was local. No production deployment was performed during the design pass.


## Step 2: character chooser plan

Use the same six foundation colors and Alegreya typography listed above. Preserve all three original game illustrations and the existing game-specific URLs. Desktop shows three equal illustrated cards with centered copy; phone and narrow tablet layouts show a single column of compact rows, with 4:5 art on the left and left-aligned copy on the right. Headings identify games, edition text identifies the rule set, and the action stays visible. Pathfinder is labeled Preview, consistent with its workshop and the project scope.

```text
Desktop
               Create a character
           Choose the rules your group uses.
 [Savage Worlds art] [D&D art]       [Pathfinder art]
 Savage Worlds      Dungeons &     Pathfinder
 Adventure Edition  Dragons 5e     2e remastered
 Start with setting Start species  Start ancestry
 Choose game        Choose game    Choose game / Preview

Phone
 Create a character
 Choose the rules your group uses.
 [art] Savage Worlds / rules / start / choose
 [art] Dungeons & Dragons / rules / start / choose
 [art] Pathfinder / rules / start / choose / preview
```

Review against the brief: the illustration deck already distinguishes this product. The catalog's animated switchers, gradients, autoplay, and extra dependencies do not improve choosing a game. Reuse CardArt and native links; remove roman numerals because these choices are alternatives, and remove the all-caps eyebrow. Isolate the chooser's CSS instead of inheriting campaign page styles. Keep existing hover/focus tokens, reduced-motion support, keyboard navigation, and artwork fallbacks. Validate actual destination workshops, artwork loading, responsive reflow, appearance, and existing journeys.

Step 2 completed locally. Existing tests: 25 Vitest character journey, character interaction, and profile entry checks; 36 Node appearance, offline routing, creation flow, and backup checks. All 61 pass. Production build and TypeScript check pass; offline build verification includes 14 pages and 90 assets. Browser checked at 320x568, 390x844, 768x1024, 1024x768, and 1440x1000, without horizontal overflow. Both appearances reviewed. All three original 640x800 illustrations load. At 390x844, all three game choices are visible without scrolling; the old Pathfinder card started below 1178px. Keyboard skip focuses main content, Tab moves between games in order, and focus remains visible. Each link opens its correct starting workshop: Savage Worlds setting, D&D species, and Pathfinder ancestry; each workshop returns to the chooser. Fresh chooser console has no errors. No new dependencies, animation, or artwork. 21st review reports no findings in the chooser component or new stylesheet; two informational shared-card notes concern unchanged hardcoded shadows/backdrop colors. Existing build warnings remain. Screenshots and check logs are in ignored output/playwright/chooser-refinement/. Verification for this step was local. No production deployment was performed during the design pass.

## Step 3: Savage Worlds workshop plan

Preserve the approved Adventurer's Journal artwork and Tactical Companion layout: original 4:5 setting/ancestry illustrations, a live character preview on the left, one creation task in the center, and the ordered journey on the right. Reuse the same six colors: forest #111d20, parchment #f5f0e6, paper #fffdf8, ink #263d3e, dark antique gold #e4be7b, and light antique gold #825b24. Alegreya remains the heading and body face.

```text
Desktop
Shared workspace navigation
[Character preview] [Choose a game | Creation book | Draft tools] [Journey]
                    [Savage Worlds          Step 1 of 11]
                    [Choose your setting]
                    [Original illustrated choice cards]
                    [Back                       Next step]

Phone
Shared navigation
[Hero name                     Draft tools | Summary]
[Choose a game | Your journey | Creation book]
[Savage Worlds                              Step 1 of 11]
[Current task and original cards]
[Back                                       Next step]
```

Left-align task text and controls; center the card artwork and names. Replace the duplicate eleven-icon phone navigation with the existing named journey menu. Make navigation, card details, and trait adjustment controls at least 44px. Show the current setting and selected ancestry with a visible text state, rather than numbering unrelated choices. Give the summary and draft tools explicit close controls, Escape handling, expanded states, and focus return. Keep native card/Creation book dialogs, the existing deliberate choice confirmation, and all current rules and budget checks.

Review against the brief: retain the existing three-column workshop rather than install the catalog's animated sidebars or introduce new scenery, gradients, or dependencies. The artwork is the expressive element; surrounding controls stay quiet. Isolate Savage Worlds CSS so D&D and Pathfinder retain their layouts. Changes to displayed selection state and panel controls do not change character mechanics or account/cloud behavior. Verify the complete existing journey, validation, backups, offline assets, desktop/phone layouts, both appearances, panels, and keyboard behavior.

Step 3 verified locally. Full test suite: 145 Vitest checks and 131 Node checks pass (276 total), including the complete Savage Worlds character journey, rules/budget validation, backups, and new panel/selection regressions. TypeScript and production build pass. The offline build includes the new stylesheet among 91 assets across 14 pages. Real browser checks covered setting/ancestry card details, Creation book, validation when required ancestry is missing, summary/draft panel close and Escape behavior, focus return, journey Escape, and home/chooser/workshop navigation. Real route reflow checked at 320, 390, 768, 1024, and 1440px with no horizontal overflow, and light/dark appearances reviewed. All five setting illustrations loaded. All 11 chapters were also rendered through the actual workshop renderers into explicitly labeled, isolated synthetic layout fixtures; all fit at both 320 and 390px, including 44px trait controls. These fixture checks are layout proof, while the automated character journey checks prove the complete interaction flow. No character choices were changed in the existing browser draft. Fresh workshop console has no errors. Existing 21st static onclick-container warnings remain, including warnings on controls that receive keyboard semantics or already have explicit role/tabindex/keydown; the backdrop has explicit Close/Escape alternatives and the trapping wrapper stops propagation. Print-style choices now have explicit keyboard activation. Existing classic-script and chunk-size build warnings remain. Captures, fixture HTML, geometry reports, and check logs are in ignored output/playwright/savage-workshop-refinement/. No backend or production deployment was performed.
