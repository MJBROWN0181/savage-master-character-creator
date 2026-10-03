# Map features for Savage Master Builder

Research checked October 2, 2026. Scope: world, region, settlement, dungeon
reference, and printable maps. Excludes virtual tabletop mechanics.

This is qualitative evidence from public GM discussions, cartographer
discussions, and individual product feedback requests. It does not establish
how common each preference is among all GMs. Wishlist entries describe needs,
not proof that every existing tool lacks the feature. Suggested priorities
below are product judgments, not a survey ranking.

## Features people value

1. **Readable names and landmarks.** Users discuss label sizes, contrast,
   hierarchy, and avoiding overlap with terrain. Keep exported text readable
   at the intended print size; offer a legend for dense maps.
   [Labeling discussion](https://www.reddit.com/r/mapmaking/comments/1fwwy4y/how_can_i_improve_my_labeling/).
2. **A clean player handout and a useful GM reference.** GMs use private room
   numbers, secret doors, and separate notes. Some prefer a single clean map
   plus a small cheat sheet, so support both workflows.
   [GM and player map discussion](https://www.reddit.com/r/DMAcademy/comments/1sw6meo/do_i_need_both_dm_maps_and_player_maps/).
3. **Distances that help run the campaign.** Users struggle to reconcile map
   scale with travel. Route duration can be more useful at the table than
   realistic geography alone. Let GMs choose units, travel rates, and overrides.
   [Distance and scale discussion](https://www.reddit.com/r/inkarnate/comments/1sqpisw/distance_and_scale/).
4. **Maps that work as physical props.** Users describe printing campaign
   maps on paper and canvas. Good exports should preserve labels, colors,
   and detail at the chosen physical size.
   [Printed campaign map example](https://www.reddit.com/r/inkarnate/comments/1uc8exo/canvas_printed_map/).

## Explicit wishes and friction

- **Connected map hierarchy:** choose a world region to open its regional map,
  then a city and a building. Inkarnate has an open request for this workflow.
  [Maps within maps](https://feedback.inkarnate.com/p/maps-within-maps-map-ception).
- **Reliable printing:** choose paper size and get a correctly scaled PDF split
  into the necessary pages. This is an explicit open request.
  [Easy Print to PDF](https://feedback.inkarnate.com/p/easy-print-to-pdf).
- **Lore available alongside a shared map:** a GM describes rewriting or
  screenshotting information because players cannot read their existing notes.
  This supports location records with separate GM-only and player-visible text.
  [Public notes request](https://feedback.inkarnate.com/p/notes-public).
- **Useful layers without stale duplicate maps:** a GM wants viewers to hide
  or show city layers and retain access to updates to the original map.
  [Layer visibility request](https://feedback.inkarnate.com/p/abilty-to-hideshow-layers-on-publish-map-without-cloning-them).
- **Different visual exports from the same world:** a GM wants both a regular
  world map and a parchment handout without recreating landmasses and assets.
  [Parchment style request](https://feedback.inkarnate.com/p/zero-support-for-switching-to-and-from-parchment-style).
- **Greater creative control:** mapmakers request reusable custom assets,
  movable landmasses, scalable output, multiple genres, offline work, and
  linked maps for sky, surface, and underground locations. These are broader
  cartographer preferences and should not be presented as universal GM needs.
  [Mapmaking wishlist discussion](https://www.reddit.com/r/wonderdraft/comments/1w73dql/what_would_your_dream_mapmaking_app_look_like/).

## Recommended sequence

1. **Location markers linked to Builder records.** Add a marker to an uploaded
   map and connect it to a town, NPC, faction, creature, or lore entry. Include
   GM-only and player-visible notes. Printed copies should have a numbered key.
2. **Player-safe exports and print controls.** Choose exactly which annotations
   to include, preview the result, then export the image or printable PDF.
   Private information must be excluded from the export data, not merely hidden
   visually. Offer a compact GM key as an alternative to an annotated map.
3. **Parent and child maps.** Connect world, region, town, building, and
   underground maps while preserving the original uploaded artwork.
4. **Scale and custom travel rules.** Calibrate distance using two points,
   draw routes, and use GM-defined travel rates. Keep manual overrides.
5. **Optional annotation layers.** Political borders, trade, factions, routes,
   and GM notes can be toggled independently and included selectively in exports.

## Implementation status

The subsequent implementation adds all five groups to the uploaded-map atlas:
numbered locations, GM/player notes, printable player exports and GM references,
parent/map connections, custom scale and travel rates, and editable annotation
layers including drawn routes and borders. World links currently point to world
sections or custom fields; dedicated town/NPC/creature records remain future work.
See [Builder implementation](MASTER-BUILDER.md) for persistence, limits, and checks.

An uploaded raster image cannot reliably have baked-in secret labels removed:
the GM must supply a clean base image or a separate player version. Layers and
style changes applied to uploaded artwork should not promise to reconstruct
the external editor's original objects or textures.
