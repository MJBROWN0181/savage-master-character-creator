# Play flow, personal workspace and keepsakes

October 1, 2026. Qualitative desk research plus prototype checks, not interviews or evidence of market-wide preferences.

## Findings

Players/GM discussions describe clunky interfaces, too much data entry, players preferring notebooks, and conflicting notes across documents. They also value flexible note arrangements, linked NPC/location cards, explicit secret visibility and exportability. We should not require players to maintain a campaign wiki: allow quick personal entries and GM-shared recaps, with optional detail. Sources: https://www.reddit.com/r/rpg/comments/10kyr1b/campaign_managment_strictly_for_gm/ and https://www.reddit.com/r/RPGdesign/comments/1lwctz2/ttrpg_online_tools_are_getting_too_complex_help/

These discussions are self-selected and some are several years old. Validate with five groups using the product for three sessions. Ask both GM and players what interrupts play, what they cannot find, what they stop updating, and what they would keep after the campaign ends.

## Recommended flow

Prepare in Storyboard/Tome; run tonight in Table View or Game Mat; capture brief notes; review and publish an appropriate recap; players add personal memories; save the actual journey in linked journals. Personal Vault provides reference files; settings belong to the individual. Keep marketplace/printing out of the middle of play. Before production, group the increasing sidebar destinations into Play, Library, Create/Sell and Settings, with a short favorites list and last-workspace resume. The preview currently exposes all destinations for review; it is not final navigation.

## Implemented in local preview

- Settings: dark/light/device mode, larger text, compact scene cards, reset; preferences survive reload.
- Game Mat: floating scene, party, clues and notes windows; drag headers, native resize, keyboard arrow movement, close/add and reset. Geometry saved locally; phones stack windows. References are sample data. Window edits do not change player character builds.
- Vault: PNG/JPEG/WebP, PDF and text uploads stored as IndexedDB blobs on this device. Filename search, download and image pinning to Game Mat. Prototype limits: 10 MB/file, 50 MB total. No remote transmission. Cloud quota enforcement, recovery/delete, tagging, document viewers and backup are future work. Browser storage can be cleared; local vault is not a durable backup.
- GM private journal: browser-local entries, separate from player journal. This is not real account access control yet.
- Keepsake Studio: editable title/subtitle and classic/parchment concept cover. No print-ready output or ordering.

Production Game Mat needs geometry recovery after viewport changes, keyboard resize/reorder, explicit saved/pending states, workspace-specific layouts, real campaign record bindings and responsive usability tests. Vault needs server ownership checks on every file/download, byte-based quotas, validated content signatures, malware scanning where appropriate, explicit sharing, trash/recovery, reliable upload progress and cancellation. Never cache private assets in the public service worker.

## Print-on-demand shortlist

| Provider | Best fit | Evidence | Next evaluation |
|---|---|---|---|
| Lulu Print API | Journals, campaign books, custom covers AND interiors | Supports personalized books and fulfillment through a site; multiple sizes/bindings. https://www.lulu.com/sell/sell-on-your-site/print-api | Compare a short mono journal and illustrated color book, cover template/spine, proofs, shipping and reprint handling |
| Printful | Character posters, framed/canvas/fine-art prints; later merchandise | Wall-art catalog and giclée page explicitly mentions digital or AI-generated artwork. https://www.printful.com/custom-wall-art and https://www.printful.com/giclee-printing | Order matching artwork proofs, inspect crop/color/resolution, evaluate API personalization, regional delivery and landed cost |
| Gelato | Alternative regional fulfillment for art/products | Custom products and documented order API. https://www.gelato.com/custom-products and https://dashboard.gelato.com/docs/get-started/ | Compare availability and landed costs in target regions; no assumption of a custom journal interior service |

Recommendation: evaluate Lulu for journals and Printful versus Gelato for artwork. No provider selected, account created, order placed or integration enabled. Personalized cover-only blank notebooks are not the same as printing a player's actual journal pages.

AI-generated artwork is technically printable; that does not guarantee rights to every image. Check tool commercial-use terms, uploaded reference rights, publisher characters/logos and the provider's content policies. Printful's AI terms treat outputs as submitted content subject to its normal terms/IP policy: https://www.printful.com/third-party-ai-tool-terms-of-use . Label AI-generated marketplace listings separately from artist-made work and allow shoppers to filter; don't imply an artist drew generated art.

## Keepsakes worth testing

Character portrait cover; dedication; personal/in-character entries; session dates and milestones; selected GM-shared recaps; character progression snapshots; original maps; party credits; blank writing pages; campaign anniversary volumes; retired/fallen hero tribute books; art prints and table reference cards. Printing checks each selected entry's visibility and asset rights. Player reviews all pages and final costs before ordering. GM secrets never enter a player book automatically. Pricing requires production cost, shipping, fees, tax handling, replacements and margin analysis.

## Verification

JavaScript syntax check passed. Browser checks confirmed settings changes, window movement, successful local image storage and persistence after reload, and pinning the image to Game Mat. Existing prototype scene/journal/Tome/marketplace interactions are separate local demos. This work does not enforce live account entitlements or deploy the prototype to smsheets.com.
