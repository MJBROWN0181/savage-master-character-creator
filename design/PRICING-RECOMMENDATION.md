# Savage Master pricing recommendation

Prepared October 2, 2026. USD, before applicable customer taxes. This is a proposed packaging and cost model, not an implemented subscription or an account of actual invoices.

## Recommended plans

| Feature | Adventurer — Free | Chronicle — $4.99/month | Storykeeper — $9.99/month |
|---|---|---|---|
| Optional annual billing | $0 | $49.99/year | $99.99/year |
| Character creation, local drafts, existing print/export formats | Included | Included | Included |
| Saved cloud characters, including archived records | 6 | No fixed count cap | No fixed count cap |
| Join other GMs' campaigns, read permitted recaps and handouts, use the shared table | Included | Included | Included |
| Personal journal | 25 saved text entries total, editable and exportable | Full linked journal: character timelines, artwork, milestones, search and historical snapshots | Everything in Chronicle |
| GM campaign allowance | 1 active owned campaign and 1 active adventure | Same starter allowance | 10 active owned campaigns; multiple adventures; no fixed archived-campaign count cap |
| GM journal | Basic private notes within the 25-entry account allowance | Full private text journal; starter campaign allowance | Full private GM journal across campaigns, linked preparation and search |
| Saved World builder projects | 1 cloud world | 5 cloud worlds | No fixed count cap |
| Campaign Tome | 1 reusable master to try saving and starting a fresh run | 3 reusable masters | No fixed master count cap; revisions and reusable preparation libraries |
| GM preparation | Basic scene notes and table preset | Same starter tools | Reusable NPC/location/clue/scene library, session archive, saved custom layouts and advanced Table View |
| Account file allowance | 10 stored files / 50 MB total | 2 GB total, no fixed file-count cap | 10 GB total, no fixed file-count cap |
| Upload formats and maximum file size | Images initially; 20 MB per map | Same | Same |
| Support | Basic help and bug reporting | Standard email support | Priority email queue; no response-time guarantee initially |

All higher plans inherit the preceding plan's general features. A Chronicle account adds personal history and modest creator capacity; Storykeeper adds tools for running and reusing campaigns. Limits on owned campaigns do not limit participation in other people's campaigns. Suggested world and Tome counts are packaging choices, not measured cost necessities.

Annual plans are about 16.5% less than paying monthly for a year, charged upfront. Offer annual billing after the paid workflows are reliable. A trial of Storykeeper may help GMs evaluate a real preparation/play/recap cycle, but is not part of the core financial model.

## Why each tier earns its place

- **Adventurer:** A complete useful character tool and free participation make it easy to bring an entire gaming group. Six cloud characters preserve the existing design decision. A permanent 25-entry starter journal lets users experience memories without expiring or deleting them. A small GM/world/Tome allowance demonstrates the preparation workflow.
- **Chronicle:** $4.99 is a modest personal subscription. The enduring benefit is keeping a character's life across adventures and groups, with artwork, linked memories and dated snapshots. More character slots help, but should not be the only reason to subscribe. It also serves a player who occasionally creates a world or prepares a game.
- **Storykeeper:** $9.99 pays for recurring preparation and table use: reusable material, multiple groups, private GM notes, session archives and personalized layouts. Ten active campaigns is generous for ordinary personal GM use; archived campaigns remain available and consume storage. One subscribing GM can host free players. Players upgrade only for their own expanded journals and libraries.

The price is a launch hypothesis, not validated willingness to pay. Check trial-to-paid conversion and continued use after at least three sessions before raising it or adding expensive benefits.

## Market reference

[Kanka's pricing](https://kanka.io/pricing) lists $4.99/month Owlbear and $9.99/month Wyvern; annual equivalents are $4.16 and $8.33/month. Its free plan has unlimited campaigns and entries, so our free campaign limit must be justified by a better character/table experience rather than scarcity alone.

[LegendKeeper's pricing](https://www.legendkeeper.com/pricing/) lists $9/month or $90/year, with free guests. Storykeeper's $9.99 is slightly higher, so connected characters, player journeys and useful Table View must deliver the difference. A full VTT or a licensed rulebook library is not implied by this price.

## Provider costs checked against public pricing

These are public rates, not verified account plans or usage. Plan assumes one paid developer seat, US East Convex pricing, and domestic US card payments using Stripe Payments and Billing.

| Cost | Published price / planning assumption | Treatment |
|---|---|---|
| Vercel Pro | $20/month base with $20 included usage credit | Budget for commercial hosting; additional seats and usage can add costs |
| Convex Professional | $25/developer/month | Production planning choice for daily backups and higher included resources; Starter pay-as-you-go is also available |
| Resend | Free: 3,000 emails/month, 100/day; Pro: $20/month for 50,000 | Budget Pro for a launch without the free daily cap |
| Stripe Payments | 2.9% + $0.30 per domestic-card transaction | Variable with paid subscriptions |
| Stripe Billing | 0.7% of Billing volume | Additional to Payments fees in this model |
| Domain | Existing registration; renewal invoice not inspected | Separate annual expense |
| Support, development, moderation, licenses, tax tooling | No actual costs supplied | Separate operating costs; not assumed free in a business profitability claim |

Sources: [Vercel pricing](https://vercel.com/pricing), [Vercel commercial-use policy](https://vercel.com/docs/limits/fair-use-guidelines), [Convex pricing](https://www.convex.dev/pricing), [Resend pricing](https://resend.com/pricing), [Stripe Payments pricing](https://stripe.com/pricing), [Stripe Billing pricing](https://stripe.com/billing/pricing). Checked October 2, 2026.

The planned paid-provider base is **$65/month** before usage, payment fees, taxes and domain renewal. Resend Free reduces that to $45 if its limits fit. A **$100–$150 monthly vendor budget** is a reasonable initial allowance for modest measured use, not a spending cap or guaranteed invoice.

Convex Professional currently includes 100 GB file storage, 50 GB data egress, 50 GB database storage, 50 GB database I/O and 25 million function calls. US East excess file storage is $0.03/GB/month, data egress $0.12/GB, database storage $0.20/GB/month, database I/O $0.20/GB and function calls $2/million. These allowances apply to the app/team's metered usage, not separately to each customer. Other compute, search and regional costs may apply.

At excess rates, a completely filled Chronicle 2 GB file allowance costs $0.06/month to store, and a completely filled Storykeeper 10 GB allowance costs $0.30/month. Downloads are additional: transmitting 10 GB costs $1.20 at the excess egress rate. A map opened by six players can create multiple transfers. Thumbnail size, browser caching and repeated full-file downloads matter more than raw file count.

### Subscription revenue after modeled payment fees

Formula: fee = price × (2.9% + 0.7%) + $0.30. Rounded display amounts:

| Plan | Monthly charge | Payment + Billing fees | Remaining before service/operating costs |
|---|---:|---:|---:|
| Chronicle | $4.99 | $0.48 | $4.51 |
| Storykeeper | $9.99 | $0.66 | $9.33 |

These calculations exclude international-card/FX charges, refunds, disputes, tax collection products and marketplace payout fees. Annual plans use one annual payment and reduce the fixed transaction-fee burden.

### Illustrative 1,000-account scenario

Assume 900 free accounts, 80 monthly Chronicle accounts and 20 monthly Storykeeper accounts. Paid conversion is an assumption, not a forecast. Assume every account fills its file allowance, each stored byte is served once monthly across all viewers, and database storage/I/O, calls, action compute and search remain within included amounts. Approximate MB as decimal GB for this illustration.

- Gross subscription revenue: **$599.00/month**.
- Modeled payment and Billing fees: **$51.56/month**.
- Stored files: 45 GB free + 160 GB Chronicle + 200 GB Storykeeper = **405 GB**.
- File-storage excess: (405 − 100) × $0.03 = **$9.15/month**.
- Egress excess: (405 − 50) × $0.12 = **$42.60/month**.
- Provider base plus modeled file usage: $65 + $9.15 + $42.60 = **$116.75/month**.
- Remaining after those costs: **$430.69/month**, before support, development, acquisition, domain, taxes, rights/licensing and other expenses. This is not net profit.

If each stored byte is served five times monthly, egress becomes 2,025 GB: excess egress costs **$237.00**, modeled providers cost **$311.15**, and the remaining amount falls to **$236.29**. This shows why storage capacity alone cannot establish profitability. A large free audience must be included in the cost model even when it never subscribes.

Fourteen Chronicle subscribers or seven Storykeeper subscribers roughly cover the $65 base after the modeled payment fees, **only before all usage and other expenses**. That is a minimum vendor-bill calculation, not business break-even.

## Entitlement and storage rules

- Unlimited means no fixed record-count cap for ordinary personal use, subject to documented record-size and anti-abuse limits; it does not mean unlimited bytes, traffic or bulk hosting. Start with clear storage quotas, measure actual bandwidth, and do not promise unlimited uploads or messaging.
- File capacity is account-wide and covers retained images/maps/attachments across all worlds, campaigns, profiles and journals. Stored files count, not lifetime upload attempts. Deleting/replacing a file frees its capacity. Shared campaign files count once against the owning campaign account; viewers do not receive duplicate storage charges. Archived material still occupies capacity.
- Begin with existing PNG/JPEG/WebP map support. PDFs are a later addition requiring validation and private access checks. Video, audio hosting and full rulebook uploads are outside these packages.
- Paid storage expansion needs an implementation change: existing world maps cap each world at 50 maps/200 MB and 20 MB per file. Account quotas alone will not unlock 2 GB/10 GB libraries if the old per-world ceiling remains. Use account storage as the main entitlement and separate per-library performance safeguards.
- On downgrade, preserve existing records, reading and export. Permit edits that do not increase over-quota storage. Block new over-limit cloud characters, campaigns or files until the account is within allowance or upgrades. Never delete journals or characters to enforce billing limits. Archived characters count toward the six free slots.
- Free users can participate in paid GM campaigns and use permitted shared Table View functionality. Premium preparation controls belong to the subscribing GM. A member's personal full journal remains their optional upgrade. A basic character sheet and personal exports remain free.

## Features charged separately or introduced later

Physical books, shipping, commissioned artwork, marketplace purchases, paid GM sessions and third-party map-editor subscriptions are separate transactions. Future AI use should have a separately costed credit allowance or paid credit packs, not unlimited generation. The current random idea assistant is local and has no model-provider bill.

When the marketplace is operational, preserve the existing design direction that both paid plans may apply to sell; free accounts may browse and buy. Subscription does not substitute for seller eligibility. Set marketplace commission only after connected-account payments, payouts, refunds, disputes and moderation costs are measured. No marketplace earnings are assumed in the subscription model.

Do not include commercial game content or publisher access as a paid benefit without the necessary rights. The proposed subscription sells original preparation tools and user-owned records. Licensed content and third-party services need their own cost and permission review.

## What must be ready before selling these plans

The repository has character/account saving, world/map storage and basic campaign/private-journal code, but this review did not verify deployed status. Character and world saving currently have no subscription entitlement enforcement. The complete linked journal, historical snapshots, reusable Tome, advanced layout/library features and the proposed billing system are not established as finished by this review.

Build and verify the paid workflows and server-side quotas before presenting the table as an available purchase. Measure database reads/writes/I/O, file storage and total egress, compute, auth emails and support effort during beta. Confirm payment webhooks, cancel/downgrade and readable exports before charging. Keep this recommendation distinct from the existing approved design and do not silently enable limits on current accounts.
