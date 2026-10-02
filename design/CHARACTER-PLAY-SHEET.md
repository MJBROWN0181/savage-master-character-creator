# 5e play sheet

The final sheet has Stats, Bio, Combat, and Spell Book sections with sticky jump links. Existing characters and freeform notes remain compatible.

Equipment & magic now stores equipped SRD weapons, armor, a shield, optional class unarmored defense, and explicit extra bonuses. AC handles heavy armor, uncapped light-armor Dexterity, medium-armor Dexterity caps (including negative modifiers), shields, and an optional final override. Heavy armor's unmet Strength requirement reduces displayed speed. Attacks use selected ability, proficiency, and extra bonuses; Finesse selects the better Strength/Dexterity modifier. Versatile damage can use two hands. The displayed damage expression includes the ability modifier and recorded bonuses. Exceptional ability substitutions are selectable when granted by a feature. Mastery requires the appropriate feature; a shield/two-handed conflict is flagged.

The personal spell book stores spell names and prepared/ready status. Its lazy-loaded SRD catalogue includes unabridged spell effects, casting metadata, higher-level rules, and original source links. Search and the ready-only filter apply only to the player's book. Spell attack and save DC use the class ability or an explicit override. Spell slots default to single-class full-caster, revised Paladin/Ranger, or Warlock Pact Magic progression. Users track spent slots, undo uses, restore slots, and record concentration. Optional total-slot overrides support exceptional GM-approved rules. Slot use never rolls digital dice.

State persists in the local draft, account snapshot, and downloaded backup. The user must save to sync their changes across devices. HP at later levels, spell selection eligibility/preparation limits, non-class spellcasting sources, free casts, Mystic Arcanum, situational damage, and subclass/feat effects remain explicit player/GM choices or notes. The app does not automatically adjudicate a cast or spend a slot when a spell is merely read.

The CC-BY-4.0 SRD 5.2.1 source and attribution remain on the page and in print. Generate weapon/armor metadata with `node scripts/build-combat-data.mjs` after regenerating the SRD catalogue.
