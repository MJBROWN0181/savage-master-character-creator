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
