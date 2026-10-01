# Security review — October 1, 2026

Scope: local prototype and existing character-account source. This is a code/config review and targeted checks, not a penetration-test certification.

## Confirmed controls

Character list/load/update uses authenticated ownership; cross-account load/update and signed-out writes are tested. Saved snapshots have a size limit. Prototype user-entered notes, titles and listing text use textContent. Resource URLs permit only HTTP(S), reject embedded credentials and use noopener/noreferrer. No remote uploads or AI calls occur in this prototype. Production dependency audit: zero reported vulnerabilities. Environment secrets are not tracked in current Git files; this check does not certify complete repository history.

## Fixes

Vault/background file input now checks PNG/JPEG/WebP/PDF signatures and disallows binary headers in plain text instead of trusting a MIME label alone. SVG/HTML uploads remain unsupported. This is basic validation, not malware scanning or a full decoder. Retain byte limits. Added Referrer-Policy and Permissions-Policy blocking camera, microphone and geolocation in production configuration; existing nosniff/frame denial remain.

## Open issues before release of connected features

- HIGH: prototype journals/vault/GM controls are not authenticated. Anyone using the same browser profile or executing same-origin script may access local data. Do not put confidential material in this demo. Production must enforce owner/campaign roles, sharing and revocation on every query/mutation/download, not merely hide buttons.
- HIGH: a Resend credential was pasted in chat earlier. Rotate/revoke it through the provider and update the authorized deployment environments. This review does not reproduce or rotate credentials.
- Turn advancement/Epic Rolls need server GM/active-participant checks and concurrency/idempotency protection. Not currently connected to live accounts.
- Cloud uploads need content validation, private storage authorization, quotas, optional malware scanning, safe download handling and secure cache boundaries. Client signature checks are bypassable and must be repeated server-side.
- Existing character saves are size-bounded but not a complete semantic schema validator; malformed authenticated payloads may break character rendering. Enforce structural validation before accepting wider shared-character workflows. Current ownership controls prevent cross-account writes.
- Production Content Security Policy is not configured. Current app uses inline handlers; deploying a strict policy requires refactoring or carefully tested compatibility. Never claim local journals are safe from script access.
- Community/marketplace require moderation, anti-spam/rate limits, safe media, account permissions and payment-provider onboarding/webhook validation before real posting or money movement.

No claim that the app is fully secure. Retest production response headers after deployment; these files are not cloud permissions or a substitute for backend implementation.

## Follow-up hardening

Added full server-side character shape/bounds/identifier validation; imported gear text is escaped before HTML rendering and imported identifiers are constrained. Added private campaign/journal backend foundation: only journal authors can list/edit their private entries, and campaign-linked GM entries require campaign GM access. Even the campaign owner cannot overwrite a player's private entry. Tests exercise these denials. These APIs are not yet connected to the local storyboard UI; no claim of secure prototype account storage.

Configured an initial CSP limiting resources/connections to self, required font services and Convex, and disabling objects/framing. Inline scripts remain allowed for current legacy handlers, so this is defense in depth, not complete XSS prevention. Key rotation remains pending user creation of a restricted replacement; the temporary key file is ignored by Git. Production multiplayer turns, cloud assets and marketplace payments are still disabled until their corresponding authorization flows are implemented.
