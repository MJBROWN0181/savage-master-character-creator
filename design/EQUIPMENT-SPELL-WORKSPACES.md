# Equipment and Spells

Equipment and Spells are independent top tabs and independent character-creation steps. The same mounted builder preserves the open character when moving between Create character, Equipment, and Spells. Older stored final-sheet step indices migrate to the sixth step.

Equipment contains Start, Browse equipment, Backpack, and Combat loadout. Its catalogue sections are Weapons, Armor & shields, Adventuring gear, Tools, Magic items, and Properties. Starting gear, starting money, and GM-set money are mutually exclusive modes. Starter kits and coin alternatives are transcribed from the licensed SRD 5.2.1 class/background tables. Both class and background kits are included in the gear path; both coin alternatives are used in the ordinary money path.

Revised level-one rules use fixed coin alternatives. Physical dice are entered manually. The SRD higher-level money guide is available from level five with explicit GM-approved wording; normal class/background gear is replaced by its coin alternatives when using this shopping path. A separate custom dice formula is clearly labeled a GM-approved house rule. No dice are rolled digitally. Incomplete dice entry, missing GM amount, and overspending block account save. Purchases deduct copper-denominated costs; removing a purchase refunds its recorded cost. Magic items without a listed price are arranged with the GM and recorded as custom grants in notes.

Kit-equipped weapons/armor are cleared when switching starting paths or kits. Manually configured loadouts remain editable. Purchase ownership and combat equipment are separate; buying an item adds it to the backpack, while equipping is a deliberate loadout action. Starter kit equipping replaces the combat loadout and marks its origin for later cleanup.

Spells contains Choose spells and My spell book. Cards show casting metadata, a short effect preview, expandable full SRD text, and direct Add/Prepared actions. Default selection filters by the character's class and available slot levels. Other granted spells, including species/feat/subclass and Mystic Arcanum choices, can be browsed explicitly. Filters include level, school, search, suggested use, ritual, and concentration. Use categories are browsing hints inferred from the effect text.

Cantrip and prepared-spell guidance for all eight caster classes and twenty levels is extracted from official tables by `scripts/build-spell-guidance.py`. Wizard book growth is shown separately from preparation limits. These are guidance rather than hard limits because granted spells may be additional. Full spell eligibility and special sources remain player/GM decisions. Slots, concentration, full effects, and recorded spell notes remain in My spell book and on the final character sheet.

All new equipment/funding state is validated on import and in Convex before saving. Legacy characters without a chosen starting path remain readable and keep their manually recorded equipment.
