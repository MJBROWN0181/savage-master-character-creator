# Character creation review

October 3, 2026. Local implementation; no live deployment.

## Current journey

Create a character opens `/create`, with three tarot-style game cards. Savage Worlds opens setting selection. D&D and Pathfinder open species/ancestry selection, followed by class. Each origin opens a short preview with a My choice confirmation and a Greater Detail expander. Each game keeps its rules, character storage, currency, and shop separate. Pathfinder for Savage Worlds is explicitly identified as a Savage Worlds setting.

The live character stays on the left and a quiet checked timeline stays on the right on desktop. Smaller screens use Your journey and an expandable character preview. The middle shows one category at a time. Name and biography are the final choices before the sheet; biography is optional. Section changes reset scrolling and focus the new heading. Save, account, backups, retail links, and licensing are tucked into disclosures.

D&D chapters: Species, Class, Background, Starting level, Abilities, Skills, Languages, Features and choices, Spells, Equipment shop, Name and story, Character sheet.

Pathfinder chapters: Ancestry, Class, Heritage, Background, Starting level, Attributes, Skills, Feats and choices, Spells, Equipment shop, Name and story, Character sheet. Attribute boosts show one stage at a time. Class key-attribute restrictions and the background allowed pair are shown during that choice.

Savage Worlds retains Setting, Bonus Rules, Ancestry, Hindrances, Edges, Attributes, Skills, Powers, Equipment shop, Name and story, Review. It retains its own trait dice, setting restrictions, and Edge/power budgets.

All three have a modal creation book listing missing requirements. Forward navigation rechecks earlier chapters. Checkmarks persist and clear when a chapter becomes invalid. Choosing the same class again preserves training and feats rather than resetting the build. New drafts do not display default origins as confirmed choices. Existing drafts and backups keep their character data, and old chapter numbers migrate to the corresponding current task. Choosing a game returns to its opening chapter without silently deleting its stored draft; New character is available in Draft tools.

Greater Detail is also available on skill, feat, spell, and equipment cards. Advanced spell filters are collapsed. Retail purchases remain distinct from the in-game currency shop.

## Biography and portrait help

The ChatGPT button opens an editable, game-specific biography or portrait prompt. Players review and copy it, open their own ChatGPT session, and paste it there. This does not call an AI API or automatically generate/upload an image. Story text is assigned as text or a textarea value, not interpreted as HTML.

## Artwork and future options

`character-art.json` reserves game, setting, species/ancestry, class, heritage, and background artwork. Empty entries show themed gold/teal ornamental frames. Add a self-hosted image path under the matching key when artwork is ready. Example structure:

```json
{
  "games": {"savage": "/images/character-cards/savage.webp"},
  "dnd5e": {"species": {"Dwarf": "/images/character-cards/dwarf.webp"}},
  "savage": {"settings": {"core": "/images/character-cards/core.webp"}}
}
```

These are example paths, not included artwork. D&D uses species/class/background names as artwork keys. Pathfinder uses the licensed row IDs in its data files. Savage Worlds uses setting and ancestry IDs. Adding rules options also requires their game-specific model, validation, grants, and starting gear support; artwork alone does not add a mechanically supported class. The UI reserves a More options disclosure and warns players to check with their GM.

Pathfinder currently lists 16 ancestries, 16 classes, matching heritages, and 62 supported backgrounds from the existing licensed data. Amnesiac is excluded and identified in the background disclosure because its third GM-assigned boost exceeds this builder's two-background-boost model.

## Verification

The automated UI walkthroughs complete new level-one D&D and Pathfinder noncasters through all twelve chapters, including card confirmation, missing-choice books, training/boosts/feats, the shop, final biography helper, character sheet, and final review. They verify that revisiting and confirming the same class preserves training/feats. The Savage Worlds walkthrough exercises its actual renderers, native card confirmation callbacks, rule validation, trait budgets, missing-choice book, final name gate, and Review. These run in an isolated test DOM; dialog behavior and scrolling are represented by test stubs, not a full browser engine.

Rendered UI checks cover every D&D/Pathfinder chapter, separate game routes, absent early name fields, and an empty preview before confirmation. Model regressions cover missing-choice assignment, chapter migration, restored drafts, spells/preparations, budgets, refund/quantity controls, and Savage Worlds progression.

Browser inspection checked the three-game portal, the D&D expanded species popup, Savage Worlds setting cards, and Pathfinder desktop/375-pixel layouts. No page-level horizontal overflow appeared in those inspected layouts. Native browser clicking became blocked during a draft-reset confirmation, so a complete new mouse/keyboard browser walkthrough could not be finished in this pass; automated interaction tests provide the full journey coverage. Signed-in cloud saves, print dialogs, external ChatGPT use, every origin/class/setting combination, and VTT imports were not exercised.

181 tests passed. The final npm test run, type check, build, and whitespace check all passed. The build still warns about the existing large Pathfinder rules catalogue and classic scripts copied by the build pipeline. D&D does not import Pathfinder's rules catalogue.

## Rules limits

The creation book validates supported core choices; it is not a full rules adjudicator. Conditional features, archetypes, additional higher-level feat selections, some species/heritage grants, feat prerequisites, restricted spell slots, and feature-granted bonus spells still require source/GM review. Pathfinder Lore and some conditional grants remain notes rather than separately modeled totals. The full reference links remain available behind Greater Detail.


## Choice limits and Bug guidance — October 3 follow-up

Choices are checked before the workshop writes them. D&D uses the class skill lists, Human/Elf grants, the selected Human Origin feat, supported class-level skill/Expertise grants, background boosts, point-buy budget, and separate class/background/Origin/species spell grants. Lineage and Divine/Primal Order are now explicit selections. A spell shared by multiple grants appears once in the book with independently counted preparation grants. Cantrips are always ready and do not consume prepared-spell choices. Wizards retain expandable learned spellbooks.

Pathfinder enforces additional trained-skill counts from class, Intelligence, duplicate grants, heritage and Skill Training; advancement rank limits; category/level feat slots, including Versatile Human, Natural Ambition, General Training and Ancestral Paragon; attribute-stage counts; base class spell slots; daily cantrips; repertoire rank counts; and prepared slots by rank. Learned prepared spellbooks stay separate from daily cantrip choices. Earlier changes retain choices that need correction and prevent forward completion until they are revised.

Savage Worlds shows the same guide for attribute/skill point exhaustion, Edge/power/language limits, Hindrance choices and their allocation. The Hindrance selector now permits legal two-Major or four-Minor combinations within its four-point creation cap. It blocks extra choices at the mutation boundary.

Bug uses a face crop of the existing approved artwork. The small native dialog traps focus, opens at the current choice, and offers Edit these choices / Continue. Missing requirements use this concise guide; the full Creation book remains available on request. The next action rechecks the latest saved choice, and an already-confirmed origin retains an ordinary Continue button after closing the popup.

Regression coverage includes actual React clicks for the D&D skill cap and fourth Wizard-cantrip rejection, source overlaps, level-dependent Expertise, Pathfinder daily cantrip/book separation, feat grants and preparation limits, Savage Worlds mutation caps, and cloud rejection of D&D excess choices. Native browser inspection verified the D&D rejection popup, Bug portrait, focused Edit button, narrow viewport layout and corrected spell counters. Complete end-to-end native mouse testing across all combinations and authenticated cloud interaction remain untested.

The follow-up passed 193 tests (94 Vitest and 99 Node), the type check, production build, and whitespace check. Existing large-catalogue and classic-script build warnings remain. Changes are local; no production deployment was performed.

The checks cover supported structured grants. Arbitrary notes are not executable rules. Conditional subclass/invocation/archetype grants, Pathfinder innate/focus access and restricted bonus spell slots, feat prerequisites, and Lore remain areas requiring source/GM review. These are not claimed as universally automated rules adjudication.

## D&D multiclass and spell flow - October 3 follow-up

D&D hides the Spells chapter for builds without a spell grant. Species magic, Magic Initiate and caster multiclasses retain the chapter. Stored chapter indices remain stable; visible numbering, Back, Continue, checklist and completion checks skip the unused chapter. A restored draft on the old spell chapter opens the shop. Spells left from an earlier class remain available for explicit repair, with a clear explanation; they are not silently deleted. Noncasting final sheets also omit the spell section.

Starting level includes an optional multiclass disclosure. Secondary class levels come out of the total, retaining at least one level in the initial class and a total of at most 20. Adding a class checks the 13-score requirements of all classes; later ability changes recheck before advancing and saving. Skills, Expertise, subclass and order choices use individual class levels. Later classes receive the reduced multiclass skill grants. Initial saving throws and starting equipment stay with the initial class. Hit Dice show each class; higher-level maximum HP remains an explicit player-entered total.

Spells are selected one grant at a time, filtered to that class's own spell level. Shared regular slots use revised 2024 caster levels, while Warlock Pact Magic is a separate pool with independent use/rest controls. Adding a regular caster to an old pure-Warlock draft migrates recorded Pact uses. The same spell can belong to two classes with independent preparation and removal. Casting totals use the appropriate class ability; species and Magic Initiate have a simple ability selector. Filling one spell allowance offers Keep choosing spells when another requirement remains.

Supported additions include Eldritch Knight and Arcane Trickster spell progression (Mage Hand is included separately), Bard Magical Secrets list access, separate exact-rank Mystic Arcanum choices, Ranger Hunter's Mark, Paladin Divine Smite/Find Steed, and fixed SRD Life Domain, Circle of the Land, Devotion, Draconic and Fiend spells. Fixed spells appear automatically as always ready, without consuming ordinary choices. Greater Detail keeps full spell descriptions collapsed by default. Other homebrew/subclass grants, invocation choices, Lore Magical Discoveries, and Wizard Spell Mastery/Signature Spells remain manual feature notes and require source/GM review.

Rules were checked against [official revised 2024 multiclass rules](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character#Multiclassing), [official class rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), and the licensed [Eldritch Knight](https://roll20.net/compendium/dnd5e/Subclasses%3AEldritch%20Knight?expansion=32231) / [Arcane Trickster](https://roll20.net/compendium/dnd5e/Subclasses%3AArcane%20Trickster?expansion=32231) tables. Pathfinder and Savage Worlds retain their separate mechanics.

Automated checks cover noncaster forward/back/restored navigation, a Fighter/Wizard creation path, prerequisite rejection, separate class preparation, higher shared slots with lower class spell access, half-caster rounding, Pact recovery, casting subclasses, always-ready grants, Arcanum, and cloud save/load/rejection. Native browser inspection also checked the repair guidance on an existing draft that changed to a noncaster; the current preview recorded no runtime errors. Signed-in browser saves and every possible class/subclass combination have not been manually exercised. Changes remain local.

Final validation passed 213 tests (104 Vitest and 109 Node), the type check, and the production build. Existing catalogue-size and copied-classic-script build warnings remain. The spell loading test now waits for the actual rendered picker before choosing spells. Temporary edit scripts were removed.

## D&D languages - October 3 follow-up

The D&D language chapter now uses selectable cards for all 19 languages in the [official revised 2024 language tables](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character#ChooseLanguages). Standard choices are visible; rare languages and full explanations stay behind Greater Detail. Common and the species language are included automatically. As requested for this workshop, the species language fills one of the two choices alongside Common: Dwarves start with Common/Dwarvish and choose one; Humans choose two. This assignment is explicitly described as the workshop's table rule, since revised 2024 normally lets players choose both. Tieflings receive Infernal as their species language.

Rogues receive Thieves' Cant plus one additional language choice, Druids receive Druidic, and Rangers receive two choices at Ranger class level 2. These follow [official class features](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes) and use individual multiclass levels. Class choices permit standard or rare languages without consuming the starting standard allowance. Choosing a class-granted rare language first still leaves the required standard starting choice. Common/species/class automatic languages cannot be removed in the picker. Species/class changes replace automatic grants and retain explicit player choices for review.

Language choices are checked before mutation and again during cloud validation. Filling the allowance opens Bug's Edit/Continue guide. Missing or excessive choices go to the Languages chapter in the creation book. The live character preview, final sheet, local draft, backup, and cloud snapshot retain the complete language list. Older free-text drafts migrate case-insensitively, including common aliases and Primordial dialects; unsupported or excessive selections remain visible for explicit repair. Custom feature grants remain GM-reviewed feature notes.

Regression checks cover all nine species, Human and non-Human allowances, class/multiclass grants, standard versus rare choices, class removal, duplicate/legacy migration, automatic grants after species changes, Bug continuation and scroll-to-top, backups, and cloud save rejection. Existing complete creation walkthroughs now use the language picker. Read-only browser inspection confirmed Common/Orc/Elvish in the existing local preview and no captured runtime errors. Authenticated browser interaction and every combination have not been manually exercised.

Final validation passed 225 tests (109 Vitest and 116 Node), the type check, production build, and whitespace check. Existing build warnings remain. Changes are local; no deployment was performed.

## Creation window sizing and quieter Bug guide - October 3 follow-up

The shared Bug guide now uses a small face-only crop beside translucent text. Its outer dialog is transparent, with a faint backdrop and simple Edit/Continue links. It retains keyboard focus, Escape dismissal, and the existing limit checks. Visible Continue text is shortened while the accessible label keeps the destination chapter.

Creation headings, labels, counters and card captions use more consistent readable sizes. Long character names wrap in the phone header. Preview columns, dialog titles, book headers and action groups fit narrow windows. Choice dialogs scroll their descriptions independently of their confirmation footer, keeping My choice/Buy visible. The Creation book keeps its close control available. The mobile Settings menu stays inside the viewport, including when a scrollbar occupies part of the window.

Savage Worlds shop tables become labeled item cards on small screens, with full-width purchase controls and unchanged purchase/refund rules. Explicit table roles preserve table semantics when the rows use a grid layout. This repairs the horizontal overflow found in the shop at 320 and 375 pixels.

An isolated local preview used representative saved character fixtures without changing the user's local draft. Browser checks covered all 35 chapters across the three games at widths 1280, 1024, 768, 375 and 320 pixels: 175 chapter layouts. Checks also covered 18 Bug guide cases across light/dark themes, expanded choice details and confirmation footers, all six Savage Worlds shop categories, the three-game entry page, each Creation book, and the shared biography helper. The final preview recorded no runtime errors. These are responsive layout checks, not a claim that every possible rules combination or authenticated save was manually exercised.

Validation passed 228 tests (112 Vitest and 116 Node), the type check and production build. Existing catalogue-size and classic-script build warnings remain. Changes are local; no deployment was performed.
