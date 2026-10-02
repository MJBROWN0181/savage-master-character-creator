# Chronicles

`/chronicles` is the public tabletop community alongside private campaign journals. It uses the existing account and reviewed public profile across all game systems.

- Deliberate text posts: session tales, epic rolls, character moments, table memories; title 100 characters, story 2,000. Sharing requires consent and an approved public profile. One post per 30 seconds, at most 20 per day.
- **Raise a toast** is a reversible, per-account reaction. **Follow / Unfollow** fills the Following feed. A storyteller may disable followers; existing relationships are inactive until enabled again. Public posts remain public.
- **Community Tomes** are public groups, distinct from the private Campaign Tome. Reviewed users create up to 10; members post, anyone reads. Owners can close a Tome, hiding its stories. Closing retains the data for site-team recovery.
- **Market shelf** shows approved creator shop links from Tome owners' public profiles. Purchases occur in external stores. This is discovery, not a marketplace checkout, commission, paid-seller entitlement, or transaction system.
- Future sponsor space is a labelled placeholder with no advertising scripts or tracking.
- Blocks apply in both directions to signed-in feeds and interactions. They do not make a public post private or prevent signed-out reading. No private journals, campaign scenes, drafts, or account email addresses are exposed.
- Cursors paginate batches of 25 before access checks/filtering; a filtered page may be empty while older pages remain. Tome discovery shows the latest 100 groups.

## Site-team moderation

Reports are retained in `chronicleReports` and `chronicleTomeReports`. Review with the internal `chronicles:reports` and `chronicles:tomeReports` functions through the Convex dashboard. Hide/restore a post using internal `chronicles:moderate` with `{id, hidden}`. Close an abusive group using internal `chronicles:moderateTome`; restore by setting its `hidden` field to false in the dashboard after review. These functions are not callable by ordinary clients. Reports do not automatically censor posts; a site-team member must review them. No automated content moderation or report notification system is included.

Posting remains text-only and React escapes user text. External shop URLs are restricted to HTTP(S), open in a separate tab, and come from reviewed snapshots. Image uploads remain in the existing reviewed profile workflow.

Backend tests cover publishing restrictions, reviewed identity versus private drafts, reaction toggling, owner deletion, report deduplication, follow opt-out, mutual blocks, group membership and closure, and cursor pagination with equal timestamps. UI checks cover desktop/mobile layouts and the community, Following, Tomes, and Market shelf navigation.
