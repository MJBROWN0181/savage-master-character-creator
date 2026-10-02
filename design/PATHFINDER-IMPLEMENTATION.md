# Pathfinder 2e Remastered implementation

Approved direction: follow the complete Savage Worlds and D&D experience, not a reference-only landing page.

## Shared experience
- Third game switch: Savage Worlds, Dungeons & Dragons 5e, Pathfinder 2e.
- Same authenticated user, profile, friendships, vault, campaign journals, and account plan.
- Separate Pathfinder rules and character data. Existing Savage Worlds Pathfinder setting remains a Savage Worlds character, never Pathfinder Second Edition.

## Character creation
1. Identity: name, ancestry, heritage, background, class, level, concept, and portrait. Each choice needs an original short summary, mechanical grants, prerequisites, source, and deeper-rule link.
2. Attributes: ancestry/background/class/free boosts, alternative boost rules, level advancement. Show the resulting modifiers and prevent applying a grant twice.
3. Training: skills, Lore, proficiency ranks, saves, Perception, and feats. Show what a skill does and its total, with the source of every grant.
4. Equipment: weapons, armor/shields, adventuring gear, tools, magic items, backpack, currency, and Bulk. Starting budget follows Pathfinder rules, not D&D money options. GM overrides must be explicit.
5. Spells: tradition, rank, cantrips, preparation or repertoire, slots, heightened effects, focus spells/points, casting action costs, range, targets, duration, components or traits, full effect, and source.
6. Live sheet: Stats, Bio, Combat, Spell Book. Calculated totals, armor/shield status, attacks and multiple-attack penalties, health, conditions, skill modifiers, saves, spells, equipment, notes, and optional printing. Play View prioritizes session controls. Physical dice remain the default.

## Calculations and progression
Use verified Remastered rules for proficiency, levels, trained/expert/master/legendary ranks, defense, attack modifiers, damage, MAP and Agile, armor penalties, Bulk, spell DC/attacks, and spellcasting progression. Do not adapt D&D formulas. Test source-derived examples, prerequisites, edge cases, and save/load round trips before release.

## Campaign integration
Persist system=pathfinder2e, validate it in creation and invitations, and keep campaign membership and journals shared across games. Only Pathfinder 2e characters join Pathfinder 2e campaigns. System-specific GM reference and encounter preparation use action costs, Perception, saves, AC, HP, conditions, and creature levels. Shared player/GM permissions remain enforced server-side.

## Content and licensing
Primary publisher license resources: https://paizo.com/licenses and https://paizo.com/orclicense. Verify each source is Remastered and licensed for the intended use; retain required notices and attribution with reused content. Do not import setting lore, trademark logos, or official artwork automatically. Link to authorized rules references; obtain licensed rules data before building catalogues. Original art follows the established gold/charcoal/teal theme.

## Release gates
- Guided choices, descriptions, rules calculations, catalogue sources, and live sheet verified.
- Cloud persistence, ownership, malformed backups, game-system boundaries, and campaign permissions tested.
- Desktop and mobile audit across every tab and creation step; no clipped controls or text.
- No release claiming feature parity until the complete flow is functional.
