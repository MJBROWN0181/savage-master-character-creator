# GM Storyboard and Character Chronicles

Design proposal, October 1, 2026. Prices deliberately undecided. This document and the interactive HTML are a design, not a deployed feature or an enabled subscription.

## Product intent

Help a GM prepare adventures, retrieve details during face-to-face play, and preserve the group's actual history. Players keep the same free character creator and gain a personal record of their characters' lives. The enduring value is a connected archive of people, places, choices, artwork, and memories that can later become physical keepsakes.

This is a tabletop companion. Full VTT maps, tokens with movement, voice/video, automated combat resolution, and a marketplace are outside the first release.

## Research and design implications

- Michael Shea describes reviewing characters, possible scenes, clues, locations, NPCs, adversaries, and rewards, adapting preparation to the game. Provide optional cards and templates rather than a compulsory writing wizard. This is qualitative practitioner guidance, not a representative survey of all GMs. https://slyflourish.com/choosing_the_right_steps.html
- Justin Alexander recommends preparing situations that can respond to player choices. Scenes need links, alternate leads, and statuses; their displayed order must not dictate player behavior. https://thealexandrian.net/wordpress/4147/roleplaying-games/dont-prep-plots
- LegendKeeper describes short notes during play and expanding them between sessions. Offer a fast capture inbox and a reviewed recap afterward, with links to reusable campaign records. https://dev.legendkeeper.com/how-to-make-good-dnd-notes/
- Kanka and LegendKeeper support campaign collaboration/customization. Our hypothesis is that direct character linkage, a focused table screen, and a personal chronicle can distinguish this product; user interviews must validate it. https://kanka.io/pricing https://www.legendkeeper.com/pricing/

Use original template wording. Research sources are inspiration, not permission to copy commercial templates or source text.

## Navigation and return flow

Top-level destinations: Characters, GM Storyboard, My Journal, Books & Resources. One account can be a player in one campaign and a GM in another; access is campaign-specific. After sign-in, resume the last workspace and session, with a visible campaign switcher. Character creation remains accessible without signing in; cloud workspaces require an account.

GM structure: Campaign > Adventures > Sessions. Scenes, NPCs, locations, clues, factions, and assets are reusable campaign records linked into sessions. The campaign dashboard shows last-session recap, tonight's preparation, outstanding threads, and the next session.

Before play: create campaign, choose system, create adventure, add scenes, attach NPCs/clues, invite players. During play: open Table View, pin essential cards, inspect stats, take fast notes, record discoveries. After play: review the session record, select what players may see, publish a recap, and roll unresolved scenes forward. Publication is an explicit action, never automatic.

## Custom layout

## Campaign Tome: confirmed reusable library

Add Campaign Tome as a workspace destination. GMs save master campaigns/adventures and browse, search, tag, revise and reuse them across groups. A master includes preparation (scenes, NPCs, locations, clues, resource references and permitted assets), not player journals, actual session outcomes, invitations or temporary character state. Private GM journals remain author-owned and are excluded by default; explicitly selected preparation notes can become template content.

Start a fresh run creates an independent campaign/adventure instance with prepared scenes, no prior player membership, and empty session history. Link the run to a specific master revision for attribution. Changes to one run do not change the master or another run. Updating a master never overwrites an active group's game; adopting selected revisions is a reviewed action. Archive completed runs while retaining their player journeys. Duplicate a master to adapt it, and export owned material for backup. All library content private by default; publishing/sharing is separate and requires content rights.

The design preview demonstrates saving sample preparation, browsing a saved master, and creating fresh local run records. It does not yet open/edit playable runs or provide cloud storage. Free library capacity and upgraded allowances await cost analysis; character creation remains free.

Initial layouts: Story-first, Stats-first, and Compact table. Users can reorder panels, show/hide panels, resize columns on larger screens, change card density and text size, and choose a readable light or dark theme. Keyboard move controls accompany drag handles. Layout preferences belong to the user and workspace, not every campaign member. On phones panels stack in saved order; detail sheets remain readable without horizontal scrolling.

Panels: Scene board, Scene details, Party stats, NPC quick reference, Clues & threads, Quick notes, Session timeline, Locations & handouts, Book references. Storyboard also supports a list view; a relationship graph is a later enhancement.

## Scene and stat cards

Scene fields: title, purpose, location, participants, situation, optional read-aloud text, GM notes, linked clues, alternate leads, outcomes, rewards, and status (prepared/current/played/deferred). A GM may create a scene with only a title. Details appear in a side sheet without navigating away from the board.

NPC fields: name, role, motivation, appearance, relationships, notes, system-tagged stat block, and book/page reference. Show relevant traits in a compact card and full details on demand. Published campaign content is not preloaded unless licensed. A book link is a reference, not copied rules text.

Party cards link owner-controlled characters by invitation. Each card identifies the character's update time. Session conditions and temporary values are separate from the permanent character build. GM edits must not silently overwrite the player's character.

## Player journal and keepsakes

### Private GM journal: confirmed product direction

Give the GM a dedicated journal linked to campaigns, adventures, sessions, scenes, NPCs and locations. Support quick entries for secrets, future plans, improvised decisions, player-character hooks, and reflections after play. Search and pin important entries to Table View. Distinguish planned possibilities from events that actually happened.

Entries are visible only to their author by default, including when a campaign has co-GMs. The author may explicitly share an entry with selected co-GMs. Campaign ownership transfers do not transfer private journal access. Publishing a player recap creates a separate reviewed copy of selected text; it never exposes the source journal. Player views, searches, notifications, exports and future printed books exclude private GM entries unless their author explicitly selects and approves material for that audience.

GM journals persist across completed campaigns, with chronological and campaign filters. The GM can export their own journal. This is a confirmed design requirement; the interactive prototype does not yet implement a separate GM journal or cloud permissions.

Suggested upgraded plan name: Chronicle. GM upgrade: Storykeeper. Names are working product names, subject to brand availability checks.

A Chronicle journal spans campaigns but is filtered by character. Entries link to sessions/adventures, people, locations, discoveries, milestones, artwork, and character snapshots. Players add their own memories in character or out of character. GM recaps appear only after explicit sharing. Private player notes remain private; the GM sees only entries shared with them. Players can retain permitted historical recaps after leaving a campaign; this must be explicit in campaign sharing settings.

### Connected journey: confirmed product direction

### Player connections and shared memories: confirmed direction

Campaign membership connects players through a party roster with character and player identities kept distinct. Players can send a friend invitation to another participant; acceptance is required for friendship. Leaving a campaign does not end an accepted friendship. Friend access does not grant campaign membership, character editing, GM secrets or private journal access. Public profile visibility is opt-in. Blocking removes unwanted contact and sharing access; report/moderation flows precede production social launch.

Shared moments link a session and the participating characters/players. A player or GM proposes a shared memory; tagged players choose whether to add it to their own journey. Use one shared source with personal reflections, not copied private entries. Epic Rolls can include supporting participants when the GM explicitly selects them. Membership and audience checks govern source access; each participant controls their own reflection. Friend-only sharing never bypasses campaign audience restrictions. Keep names/credits attached to memories while respecting removal/export policies.

Journal includes Party Memories with fellow heroes, accepted shared moments and a timeline of adventures together. A future party book can combine approved recaps, artwork and contributions with consent and attribution. Direct chat and public social feeds are not required for the first release; friendship begins with shared table history. Prototype can illustrate sample relationships without creating real friend accounts or sending invitations.

Each player's journal connects to the GM and campaign they are participating in for that session. Accepting a campaign invitation and attaching a character establishes that connection. The journal opens in the active campaign context, shows the GM and adventure, and links directly to the permitted session record. If the player participates in multiple groups, they explicitly choose the campaign; the app must never guess from their most recent login.

A shared session record is the common anchor: the GM's published recap, each player's personal memories, character milestones, and permitted handouts connect to it. Shared recap corrections update the linked view with revision history; personal entries remain authored and controlled by their player. Support both in-character storytelling and the player's own out-of-character memories.

Ending a campaign or changing GMs starts a new chapter in the same character journey. Keep the original campaign, session, and GM attribution on old entries. Campaign ownership changes must not rewrite who ran past sessions. A character can participate in several campaigns without merging their timelines or silently carrying temporary stats between groups. A session snapshot records the version of the character used at that table.

Sharing remains explicit: linkage does not give a GM access to private player notes or give a player access to unpublished GM material. Removing a membership revokes live campaign access while retaining the player's own writing and explicitly granted historical recap copies. Historical copies record their source and revision; later source updates require renewed access. Future storybooks can combine selected chapters only after a preview checks visibility, attribution, and permission.

Acceptance: a player can open a journal entry and reach its permitted campaign/session details; a GM can see entries the player shared with that campaign; a player in two campaigns sees the correct GM and session context for each; switching campaigns does not expose secrets or modify past attribution; private entries never appear in shared recaps or another member's export.

Separate the editable current character from dated history. A renamed or advanced hero does not rewrite old sessions. Credit coauthors and record asset ownership/permission, captions, image resolution, and visibility now, so future printing does not expose secrets or use unlicensed art.

Later: curated journal/book preview, page ordering, print-safe images, explicit sharing consent, vendor quote/shipping, and purchase checkout. Physical printing remains a separate purchase and is not bundled into unlimited uploads. Public publication and personal printing have different content-rights requirements.

## Proposed entitlement matrix

| Capability | Free | Chronicle (player) | Storykeeper (GM) |
|---|---|---|---|
| Character creation and existing exports | Included | Included | Included |
| Cloud character records | 6 | Unlimited character count | Unlimited character count |
| Uploaded files | Proposed 10 stored files / 50 MB total | No fixed file-count cap | No fixed file-count cap |
| GM workspace | Proposed 1 campaign / 1 active adventure | Same free GM allowance | Multiple campaigns/adventures |
| Player participation and reading shared recaps | Included | Included | Included |
| Personal linked journal, artwork and historical snapshots | Preview | Included | Included |
| GM layouts | Basic preset | Basic preset | Saved custom layouts and presets |
| Reusable scene/NPC library, session archive and richer preparation | Limited trial | Limited trial | Included |

Only the six-character limit is user-decided. Other free limits are proposals pending cost analysis and user feedback. Define character storage as all cloud records, including archived ones; local drafts and exports stay free. Updating a saved record does not consume a slot. Existing accounts above six keep their data and may edit/export it; new saves pause until below the cap or upgraded. Never delete records on downgrade.

Unlimited should mean no fixed count cap, not infinite bytes or bandwidth. File size, permitted types, storage and fair-use policy require cost measurement before a public promise. Initially support images/PDFs, not video. Upload counts mean stored files, not lifetime upload attempts; replacing or removing a file frees allowance. Server-enforced, transactional entitlement checks must cover import, duplicate, upload finalization, and concurrent saves. No paid limits are enabled in this design.

## Permissions and reliability

Roles: campaign owner/GM, invited co-GM, player, optional viewer. All records private by default. Visibility levels: GM-only, whole party, selected members, owner-only journal. Every query, search, link preview, download and export enforces access server-side. Spoiler-free preview shows exactly what a selected player will see. Sharing character stats is explicit and revocable.

Autosave with visible saved/pending/error state and conflict handling. Pin a session for offline read access only when explicitly requested; offline editing/sync is a separate engineering milestone. Never cache private records through the public static service-worker cache. Account switch/sign-out clears private device caches. Restore deleted content through a defined recovery window; never silently discard notes.

## Data direction

Reuse Convex authentication and character ownership. Add campaigns, memberships/invitations, adventures, sessions, scene/NPC/location/clue records, record links, journal entries, assets, layout preferences, entitlements and character snapshots. Every shared record has campaign/owner, visibility and timestamps. Journal entries have author, character, campaign, adventure, session, character snapshot and audience. Sessions retain the GM attribution at time of play and recap revisions. Assets have storage ID, bytes, media type, rights metadata and owner. Separate shared data from each user's layout.

System-neutral campaign records carry systemId and edition; stat blocks are structured adapter data plus user-authored text. Begin with Savage Worlds and generic notes; later D&D/other adapters require their own content/licensing review. No assumption that one game's license covers another.

## Books and affiliate research

## Community marketplace: confirmed product direction

### Hire a GM services

Confirmed: dedicated Hire a GM area where eligible paid-account GMs advertise their facilitation services. A GM listing needs experience, games/editions, languages/timezone, online or public venue, duration, group size, beginner suitability, accessibility, content boundaries, price basis (per player/session/package), availability, delivery/cancellation/refund terms. Do not display private home addresses. Initial proposal is adults 18+ only; age enforcement and service terms are launch requirements.

Show visible guidance covering consent/stop signals, recording consent, privacy, scam warning, public venues and reporting. Paid subscription is not verification or endorsement. Identity checks do not guarantee safety; do not claim background checks absent an actual service. Dedicated private report/block workflows, human moderation, urgent escalation, verified-booking reviews, dispute/refund handling and service-specific payment liability must exist before bookings launch. Never describe local draft forms as monitored safety channels.

GM revenue is service revenue, distinct from downloadable campaigns and artwork. Define commission, payment authorization timing, cancellations, no-shows and fulfillment before accepting money. Prototype adds a category and draft listing option, fictional sample and safety guidance only. No real hire, booking, verification, report delivery or payment protection enabled.

Free accounts may browse and purchase. Paid Chronicle and Storykeeper accounts may apply to sell original artwork, character commissions, handout/assets and campaigns/adventures. Paid membership alone does not bypass seller verification, content rights or moderation. Platform earns a percentage of transactions; rate and prices are undecided. Separate digital downloads from commissioned services with scope, delivery deadlines, revisions, usage license and fulfillment tracking.

Campaign Tome has Publish for sale: select a master revision, prepare a separate commercial listing, choose compatible game/edition, deliverables, sample preview, price and buyer usage terms. Exclude group session history, player journals, personal data and private GM journals. A rights checklist and explicit final publication action precede listing. Purchasing an adventure creates a licensed library copy that can start separate runs; it does not expose the seller's campaign. Version updates are opt-in for existing runs. Handle withdrawn products without silently erasing legitimate purchased copies, subject to rights and legal obligations.

Prototype supports marketplace categories, original sample offers, private local listing drafts, and a Tome-to-listing handoff. No payments, public publishing, downloads, commissions, payouts or entitlement enforcement are enabled.

Before launch: verify publishers permit selling each game's content through this marketplace. SWAG permissions do not automatically permit sales on our own site. Use a marketplace payment provider with connected seller onboarding/payouts; keep balances, commission, processing fees, refunds, disputes and payout status in an auditable ledger. Confirm who is merchant of record and handles tax, reporting and chargeback liability. Design rights complaints/takedowns, prohibited listings, commission cancellations and asset safety review. No platform cut can be chosen responsibly until these costs and responsibilities are measured.

Create a curated resource shelf filtered by game/edition, purpose and format; support user-entered book/page references and links from NPC/scene cards. Don't imply purchasing a book unlocks our licensed content. Do not scrape or host books.

Confirmed: Books & Resources includes a personal web-link collection. Add a title and http/https URL, open the resource in a separate tab, and edit/remove saved references. Later allow notes, tags and links to particular campaigns/scenes. Personal resources are private by default; campaign sharing is explicit. Saved personal links receive no affiliate code automatically. Reject unsafe protocols and embedded login credentials; render user text safely. The prototype supports add, open, remove and browser-local persistence; account storage and editing are subsequent implementation requirements.

DriveThruRPG requires confirmed affiliate status. Its FAQ advertises up to 5% for standard affiliates, up to 8% for qualifying publishing/community-content partners, a 15-day referral window, and PayPal cash-out with a $1 processing fee. Confirm terms at enrollment. Add a clear affiliate disclosure by monetized recommendations; keep recommendations useful and avoid unapproved tracking. No application or external message has been sent. https://help.drivethrupartners.com/hc/en-us/articles/12780762767767-Affiliate-Program-FAQ

Pinnacle's Fan License prohibits compensation for the product and excludes settings; a commercial license does not automatically include setting rights. Obtain written clarification for the free builder, paid companion, existing content, affiliate placements and eventual printed works. This is a launch dependency, not a reason to stop design. https://shop.peginc.com/pages/licensing

## Delivery stages and acceptance

### Community and support: confirmed direction

Community & Support provides help/FAQ, private error/bug reporting, searchable feature ideas with votes and staff responses, a categorized message board, official upcoming-update announcements, release notes, known issues and roadmap statuses. Bug reports capture steps, expected/actual behavior and optional device details; diagnostics/attachments require opt-in and redaction. Users can track private ticket status. No private report becomes a public post automatically.

Board categories initially General, GM Tips, Character Stories and Looking for a Group. Production needs authenticated posting, user-selected audience, moderation/report/block, spam limits and staff permissions for announcements. Ideas have submitted/reviewing/planned/shipped/declined states with no implied release promises. Search duplicates before submitting. Basic help and bug reporting remain accessible regardless of subscription. Demo forms save local drafts only; real submission and delivery confirmations require backend implementation.

### Epic Roll: GM-controlled capture

Confirmed: one Epic Roll button in Table View and Game Mat opens a short form for participant/character, physical dice count/types and result sequence, final total including modifiers, and event description. Capture needs no digital dice or turn-tracker activation. Save attaches a GM-authored moment to that player's character journal with campaign/session, timestamp and historical GM attribution. Players can read their awarded moments but cannot create, edit, delete or trigger GM Epic Roll records. The GM can correct their own entry with revision history; an explicit save is required to publish the event text to the selected player, never automatic copying of private notes.

Production checks current GM permissions and target campaign membership server-side, stores participant/character/session IDs rather than names, and uses an idempotency key to prevent retry duplicates. Show a journal link and correction option after success; show unsaved state on failure. Player export includes only authorized moments. The local prototype demonstrates saving and viewing Elian's events with synthetic GM identity; it does not implement authentication, server permissions or live delivery.

### Simple turn tracker: confirmed direction

Hold the physical dice ideas for later. GM can enable/disable a session turn tracker, choose the active player from a dropdown, arrange the player order, and click Next. Active player sees a top-of-screen Your turn indicator with a brief animation respecting reduced-motion preferences and an End turn button. Non-active players never get the active-player banner. Turning the feature off removes notifications and disables progression. Wrap from last participant to first; GM can skip directly to someone or handle NPC turns manually. No automatic dice/initiative resolution is required.

Production uses campaign-linked character/participant IDs, not typed names. GM-only mutations control enabling and ordering; End turn is permitted only to the authenticated active participant. Each advance sends the expected session/turn revision so simultaneous GM Next and player End requests advance only once. Reconnect reads current state, not queued obsolete banners. Revoked members cannot change turns. Notification is an accessible text/light cue; optional sound defaults off. Keeping this fast is more important than extra animations.

Prototype controls are in Table View, reachable from Game Mat. It demonstrates GM selection/Next and a selected player's top banner/End in the same browser. It is not live account-to-account signaling. Turn tracking is optional and GM-controlled in production.

1. Design prototype: switch board/table/journal, select scene details, change layout and capture a sample note. Synthetic demo content only. Prototype local persistence is explicitly distinguished from real account/cloud storage.
2. Private functional beta: sign-in/resume, owned campaign/adventure CRUD, scene/NPC cards, saved layouts, basic notes, invitations and player-specific sharing. Five GMs across at least three sessions; target finding a scene/stat in under ten seconds and capturing a note in under five seconds. These are proposed targets, not achieved findings.
3. Journals and entitlements: dated character snapshots, shared recaps, private notes, quota enforcement and usage reporting. A player cannot retrieve another player's private note or any GM secret through search/export. Above-limit existing accounts retain access. Retry cannot create duplicate notes/charges/files.
4. Paid release: rights clearance, measured costs, payment/webhook reliability, cancellation/export, support/refunds and prices. Track returning groups, retained journals and subscription conversion, not just account counts.
5. Keepsakes, more game adapters and affiliate/publisher integrations.

Cost ledger before pricing: database reads/writes, file bytes and egress, image processing, email, payment/billing fees, support, licenses, backups and print vendor costs. Measure ordinary and heavy usage. Unlimited messaging is contingent on a sustainable and clearly disclosed policy.

Open decisions: final upload/storage limits, GM free adventure allowance, journal preview scope, historical sharing after removal, print supplier, branding, offline scope and licensing. Pricing is intentionally deferred.

## Simple assistant: October 1 direction

Keep a collapsible assistant with Name, Item, and Story idea choices; Fantasy, Western, and Sci-fi styles; one short suggestion at a time; Try another and Keep in notes actions. The prototype uses local random generators with original sample content, no API or ChatGPT connection and no external data transmission. Keep explicitly inserts a private session note and prevents duplicate insertion until the next suggestion. AI research is a later optional capability; do not imply random results are AI-generated. Future contextual suggestions require selected-content preview, permission checks, server-side provider credentials, usage budgets, and explicit save rather than automatic campaign edits.
