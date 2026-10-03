# Savage Master Builder

The first dedicated tool is the World builder at `/builder`. Choose a rule
foundation before opening the other steps: World & lore, Maps, Play style &
rules, and Review world. Supported foundations are Savage Worlds, D&D 5e,
Pathfinder 2e, another named system, or an original named system. Edition,
rules approach, world sections, play style, house rules, and extra labeled
fields are editable. Recorded rules do not modify existing character engines.

Creatures, species, magic items, gods, towns, cities, NPCs, monsters, and lore
have roadmap labels; they are not dedicated builders yet.

## Persistence and maps

- Text drafts autosave to the versioned browser key
  `savage-master-builder-world-v1`. JSON backups round-trip incomplete drafts.
- Signed-in users save, list, and load owner-only `worldBuilds` through Convex.
  A production rollout requires deployment of the new backend and frontend.
- Raster map uploads support PNG, JPEG, and WebP, with matching file headers.
  Each local or account library allows 50 maps, 200 MB total, and 20 MB per file.
- Local maps are blobs in IndexedDB `savage-master-world-maps`, grouped by the
  world's stable `mapKey`. Browser storage can be cleared; keep original files.
- Account maps use Convex storage and owner-only metadata queries. Upload
  tickets expire after 15 minutes and are consumed on successful registration.
  Access checks cover upload, registration, listing, annotation updates, and deletion. Storage URLs
  are bearer URLs; anyone given an image URL can view that file.
- Local maps can be moved individually into an open account world. JSON world
  backups contain text, not image bytes or account storage references. Download
  maps separately. Importing a backup into another browser requires reuploading
  its maps. Print review includes world text and available maps.

## World atlas

Open an uploaded map in the Maps step to edit its atlas. Review world opens the
same atlas with editing disabled. Save annotations is explicit; closing warns
about unsaved edits. Original artwork remains unchanged.

- Numbered locations have coordinates, type, approved player notes, separate
  private GM notes, links to world lore/custom fields, and connections to maps.
- Maps have stable atlas IDs and optional parents, supporting world, region,
  town, building, or any custom hierarchy. Parent cycles are rejected. Moving
  browser maps to an account preserves IDs, notes, and links. Deleted or absent
  linked maps can be reconnected later.
- Editable layers control colors, visibility, and player eligibility. Custom
  layers start private. Locations and paths also require individual approval.
- Draw travel paths or closed borders/regions. Calibrate with two points or the
  full map width, choose any distance unit, and enter a custom distance-per-time
  rate. Routes account for image aspect ratio, difficulty multipliers, and GM
  overrides. These are planning estimates; recorded rules do not alter engines.
- Player PNGs and HTML location keys use an explicit projection that removes GM
  notes, private/hidden annotations, world links, map links, and travel overrides.
  Player exports require confirming that the base artwork is safe. The app cannot
  remove secrets burned into the uploaded image; upload clean player artwork.
- Print/save PDF uses browser printing with Letter, A4, or A3, both orientations,
  single-sheet fitting or a chosen poster width in inches. Poster sheets overlap
  by 0.15 inches and include row/column labels and a one-inch print check ruler.
  Print at 100% and choose the matching paper. A location key follows the map.
  Up to 100 map sheets are supported. Export canvases cap at 8,000 pixels per edge
  and 40 million pixels; originals remain available separately.
- Private annotation JSON backups can be restored onto an uploaded image.
  World text backups still exclude maps and annotations. Keep the original image
  and annotation backup together for editable recovery in another browser.

The atlas provides static reference maps and physical handouts. It has no tokens,
live multiplayer, fog of war, embedded drawing engine, or artwork style conversion.

## Map tools researched October 2, 2026

| Tool | Fit | Current connection |
| --- | --- | --- |
| [Inkarnate](https://inkarnate.com/faq/) | Browser drawing for worlds, settlements, battle maps | Open editor, export an image, upload |
| [Azgaar](https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Knowledge-Base) | Free generated world geography, cultures, states, settlements | Open editor, export PNG/JPEG, upload |
| [Dungeondraft](https://dungeondraft.net/) | Paid desktop dungeon and encounter editor; universal VTT export | Upload rendered map image |
| [Wonderdraft](https://wonderdraft.net/) | Paid desktop world and continent editor | Upload rendered map image |

Azgaar is the strongest candidate for a future bundled editor because its
[MIT license](https://github.com/Azgaar/Fantasy-Map-Generator/blob/master/LICENSE)
permits modification and redistribution with the required notice. This is an
integration recommendation, not an implemented embedding. Its JSON/GeoJSON
exports also offer a possible route to importing world data.

Dungeondraft's universal VTT export is a future path for walls and lighting;
the current upload library handles images only. Its modding API concerns the
desktop editor and does not establish an embeddable web editor.

Inkarnate's current FAQ distinguishes personal-use Free/Creator plans and
commercial-use Studio. Prices and terms can change. We link to the editor and
official details; no account linking, subscriptions, third-party iframe, or
direct editor API is implemented.

## Validation

Model tests cover arbitrary rules and play styles, incomplete backups, malformed
imports, field limits, and duplicate IDs. Convex tests cover owner-only world
access and map upload tickets, signature checks, retrieval, annotation updates,
stable IDs, invalid coordinates, parent loops, and removal. Atlas tests cover
player privacy, print tiling, escaped handout text, scale geometry, and travel
rates. Browser verification covers the rule-set gate, local uploads, annotation
persistence, private/player views, route drawing, scale, and responsive layout.
Live authenticated cloud upload and physical printer output remain rollout checks.

## Layout review

The October 2 review checked all five steps at 320, 390, 768, and 1,440 pixels,
plus the atlas at 1,024 pixels. It covered the account panel, upload form,
recommended editors, location details, long names without spaces, and poster
controls. Checks found no remaining horizontal overflow or overlapping controls
in these views after the fixes.

Phone map/print controls use full-width rows and shorter option labels. Custom
text wraps inside cards. File controls stay within their containers, and the
atlas modal's sizing rules take priority over the older image-preview styles.
Numbered badges remain inside the image at map corners in both the editor and
exports, while recorded location coordinates stay unchanged.
