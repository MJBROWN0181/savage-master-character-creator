# Profile sharing and review

Each account has one profile with optional Player and Game Master roles. Personal fields are optional. The fixed handle is the share address; account email and age confirmation are never returned by the public query.

Age confirmation is an 18+ self-attestation, not independent identity or document verification. Do not describe it as verified identity. A stronger age assurance service can be added before opening profiles to younger users.

Profiles start private. Requesting public sharing puts the draft into an internal review queue and hides any previously published version. Publishing requires a trusted operator to review the entire draft, including every image, link, and excerpt. There is no user-facing approval endpoint. No automatic image/content moderation service is configured.

Trusted operators use `profiles:reviewQueue` through the Convex dashboard or privileged CLI. Review for sexual/explicit imagery, hate, harassment, threats, scams, private information, and rights to uploaded material. Use `profiles:moderate` with the profile ID, exact `updatedAt`, and approve boolean. A changed draft invalidates the review. Use `profiles:withdraw` to hide an approved profile after a valid report. Reports are stored in `profileReports`; operators must check and act on these. This is a manual workflow and requires staffing before promoting public profiles.

Images are decoded and re-encoded as WebP in the browser to remove source metadata, capped in dimensions, and checked server-side by byte signature and file size. These checks protect file format handling; they do not detect offensive visual content. Uploads are limited to 20 registered profile images per day. Storage cleanup, stronger upload rate limits, and automated moderation are future operational improvements.

Only owned characters may be featured. Public character cards contain the name and chosen portrait, not their entire sheet. Only exact, explicitly selected excerpts from the user's player journals may be shared. GM journal entries cannot be featured. Public snapshots freeze reviewed content; edits to an approved profile do not silently change what visitors see. Shop/social links must use HTTPS and open separately with no opener access. Marketplace listings are linked by URL until the marketplace has real listing records.

The personal editor allows safe background/color/font/layout presets, a custom background image, and section ordering. It accepts no arbitrary HTML, script, or CSS. The profile avatar stays a fixed circular identity area; account controls remain outside the customized page.
