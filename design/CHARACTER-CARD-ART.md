# Character card artwork

Savage Master's approved signature direction is **Gilded Storybook**: original ink-and-watercolor adventure illustrations in forest teal, antique gold, warm parchment and worn leather. The durable [style guide](SAVAGE-MASTER-ART-STYLE.md) defines composition, references, content accuracy and future generation. Its [machine-readable version](SAVAGE-MASTER-ART-STYLE.json) supplies the canonical generation prompt.

Game, setting, species, class and heritage cards each have their own illustration. Artwork is never shared between games or between entries with the same name. Savage Worlds settings, D&D and Pathfinder keep their own subjects, rules and atmosphere. New entries remain placeholders until their individual artwork is ready. Per the owner's October 3 update, background choices use titles over lightweight teal-and-gold CSS decoration, with no individual portrait production. Existing background originals are preserved.

Original PNGs are preserved in `art-source/cards/`; optimized 640-pixel-wide WebP exports are in `../images/art/cards/`. Full prompts and source paths are recorded in [CHARACTER-CARD-ART-PROMPTS.json](CHARACTER-CARD-ART-PROMPTS.json). Corrections retain earlier versions. Active mappings are in `../character-art.json`, and remaining work is recorded in [CHARACTER-CARD-ART-QUEUE.json](CHARACTER-CARD-ART-QUEUE.json).

Images appear in card decks and detail dialogs. Labels and mechanics remain real application text. Card images load lazily; small-screen popup artwork uses contain sizing to preserve the subject and confirmation controls.

For current coverage run `node scripts/character-art-work.mjs audit`. Run `node scripts/verify-card-art.mjs` to check original/export files, dimensions and unique image content. Artwork remains local until a release is requested.
