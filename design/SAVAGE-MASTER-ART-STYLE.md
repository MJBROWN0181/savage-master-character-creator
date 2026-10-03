# Savage Master — Gilded Storybook

This is Savage Master's signature character-card art direction, approved by the owner on October 3, 2026. Use this guide for future illustrations and additions to the character builder.

## Look and atmosphere

Original hand-painted ink-and-watercolor adventure illustrations, with crisp etched linework, subtle paper texture, expressive faces and believable equipment. The palette centers on forest teal, antique gold, warm ivory parchment and worn brown leather, with restrained burgundy and amber highlights. Keep the result inviting, detailed and mature, with the tactile quality of an illustrated adventure book.

## Composition

Use vertical 4:5 artwork with a clear silhouette that reads at small card sizes. Keep important anatomy and equipment inside the central 75 percent, and faces near the upper third when appropriate. Vary portraits with action, profiles, seated figures, occupation scenes and landscapes. Vary ages, faces, body types and practical clothing. Avoid repeating the same forest, castle or pose across the deck.

Do not embed lettering, rules, numbers, borders, logos or UI. The application supplies accessible labels, descriptions and controls. Humanoid characters should be adults in fully covering practical clothing or armor.

## Content and originality

Every illustrated card receives a separately generated original illustration. Never reuse a portrait between games, classes, species or heritages, including entries with the same name. Background choices are an approved exception: titles over subtle teal-and-gold CSS decoration, with no portrait needed, to reduce production. References establish brushwork, palette and atmosphere; they do not authorize copying the subject or composition.

Keep Savage Worlds settings, D&D and Pathfinder distinct. Depict each entry's actual anatomy, equipment, culture and setting. Heritage art must show its particular physical or environmental distinction. Check uncertain anatomy against game sources before generating. Avoid existing named franchise characters.

## Reference deck

Use these installed originals as visual anchors, alongside their full prompts in CHARACTER-CARD-ART-PROMPTS.json:

- Game chooser: `images/art/cards/game-savage-v1.webp`, `game-dnd-v1.webp`, `game-pathfinder-v1.webp`.
- Frontier atmosphere: `images/art/cards/savage-settings-deadlands-deadlands-v1.webp`.
- Distinctive anatomy: `images/art/cards/savage-species-grackle-tooth-rf-grackletooth-v2.webp`.
- Fantasy species: `images/art/cards/dnd5e-species-dragonborn-dragonborn-v1.webp`.

## Reusable generation prompt

Start with the card's game, name, accurate physical features, abilities expressed visually, action and location. Append the canonical `corePrompt` from SAVAGE-MASTER-ART-STYLE.json. Give each entry a fresh subject and composition. Use existing pictures only as style references when needed.

## Saving and review

Preserve original PNGs in `design/art-source/cards/`. Export WebP at 640 pixels wide, quality 84, without enlargement, to `images/art/cards/`. Keep original prompts and paths in `design/CHARACTER-CARD-ART-PROMPTS.json`; map each card in `character-art.json`. Corrections receive a new version and retain the earlier original.

Inspect anatomy, crop, small-card readability and the detail popup before considering a card finished. Run `node scripts/character-art-work.mjs audit` and `node scripts/verify-card-art.mjs` to verify coverage, missing files and accidental reuse. Pending cards remain tracked in CHARACTER-CARD-ART-QUEUE.json.
