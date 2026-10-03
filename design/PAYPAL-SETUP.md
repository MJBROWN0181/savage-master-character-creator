# PayPal setup — packages on hold

Updated October 2, 2026. The user is still building features and asked to defer the packages. This change prepares payment infrastructure only. It does not impose new character, journal, world, campaign or upload limits, show package offers, or enable customer purchases.

## Current result

- PayPal server client, reserved/idempotent subscription creation for later use, payment verification, signed webhook processing, cancellation and six-hour reconciliation are implemented locally.
- The Billing & Account page at `/pricing` displays a setup notice, account sign-in and existing subscription management. It has no purchase buttons or advertised package allocations.
- Merchant setup creates a service product and webhook by default. Plan creation requires an explicit `--create-plans` flag and is deferred.
- Checkout requires both `PAYPAL_PACKAGES_READY=true` and `PAYPAL_CHECKOUT_ENABLED=true`. Both default off. Live checkout additionally requires `PAYPAL_LIVE_READY=true`.
- The dedicated `Savage Master - Sandbox` REST app is connected to development Convex (`energized-swordfish-188`). Its credentials are stored server-side and in the Git-ignored `.env.paypal.local` operator file.
- Sandbox service product: `PROD-6KT866332F9933522`. Sandbox webhook: `95P98239K4042621H`, registered at `https://energized-swordfish-188.convex.site/paypal/webhook` for the nine required events. These IDs are not credentials.
- The development backend was deployed successfully. Its billing summary confirms sandbox mode, credentials and webhook configured, and checkout disabled. An unsigned HTTP notification returns `400 Missing signature.` All 92 automated tests, TypeScript checking and frontend build passed.
- No plans, customer subscriptions or charges were created. No production deployment or live credentials were configured. Real payment and signed-event end-to-end tests remain deferred until packages are approved.
- The current PayPal login is personal. Keep it personal and use a separate PayPal Business merchant account before accepting real payments; the named sandbox app separates the test integration, not live balances.

## Connect PayPal without launching packages

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox). A US personal account can prepare sandbox testing; a Business merchant account is required before going live. Create or select the dedicated `Savage Master - Sandbox` REST app. Keep the client secret out of chat and out of frontend variables.
2. Configure the intended development Convex deployment with `PAYPAL_ENVIRONMENT=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` and its frontend `SITE_URL`. Keep `PAYPAL_PACKAGES_READY=false`, `PAYPAL_CHECKOUT_ENABLED=false` and `PAYPAL_LIVE_READY=false`.
3. Review other outstanding workspace changes before deploying the backend: Convex deploys the entire backend. Generate the API as part of deployment. This integration adds billing tables, a webhook HTTP route and a reconciliation cron; it does not change existing save/upload behavior.
4. Find the deployment's **HTTP Actions** origin, ending in `.convex.site`. The webhook URL is `https://YOUR-DEPLOYMENT.convex.site/paypal/webhook`, not the `.convex.cloud` client origin.
5. Put the two sandbox app credentials, `PAYPAL_ENVIRONMENT=sandbox` and `PAYPAL_WEBHOOK_URL` in an ignored `.env.paypal.local` file. The repository ignores `.env*` files. Never commit credentials.
6. Run `node --env-file=.env.paypal.local scripts/setup-paypal.mjs`. The script creates only a merchant service product and signed notification webhook. It does not create packages, customer subscriptions or charges. It prints non-secret IDs only.
7. Store the printed `PAYPAL_WEBHOOK_ID` in the same development Convex deployment. Retain `PAYPAL_PRODUCT_ID` in the ignored file for future setup runs. The script reuses a webhook matching the URL and checks its event selection.

PayPal can require the user to complete device verification and sign-in. Creating a new financial account or accepting new account terms is a user action. The user created the dedicated sandbox app and explicitly approved copying its sandbox credentials into the ignored local file and the development Convex backend. No live merchant account was created or upgraded.

## Configuration reference

| Server variable | During setup |
|---|---|
| `PAYPAL_ENVIRONMENT` | `sandbox` |
| `PAYPAL_CLIENT_ID` | Sandbox REST app client ID |
| `PAYPAL_CLIENT_SECRET` | Secret for that app, server-side only |
| `PAYPAL_WEBHOOK_ID` | Signed notification webhook from the same app |
| `SITE_URL` | Frontend origin; local HTTP is allowed in sandbox only |
| `PAYPAL_PACKAGES_READY` | `false` |
| `PAYPAL_CHECKOUT_ENABLED` | `false` |
| `PAYPAL_LIVE_READY` | `false` |
| `PAYPAL_CHRONICLE_PLAN_ID` | Leave unset until packages are resumed |
| `PAYPAL_STORYKEEPER_PLAN_ID` | Leave unset until packages are resumed |

The setup script uses `PAYPAL_WEBHOOK_URL` and optional `PAYPAL_PRODUCT_ID`; those are operator configuration, not browser variables. No PayPal credential uses a `VITE_` prefix.

## When packages are ready

The earlier pricing recommendation remains a proposal. The backend's draft monthly plan validation uses Chronicle $4.99 USD and Storykeeper $9.99 USD; those names/prices can be revisited before launch. No feature allocation is enforced by billing in this stage.

After package confirmation, run setup with `--create-plans` to create or validate indefinite monthly plans, without trials, setup fees or added taxes. Retain printed plan IDs and set them in Convex. Explicitly pass existing product/plan IDs on later reruns: PayPal idempotency keys are temporary and cannot prevent duplicates indefinitely.

Complete real sandbox tests before enabling checkout: settled monthly payment, wrong price/currency/account rejection, forged notification rejection, retry/double-click deduplication, cancellation, failed renewal, suspension, full/partial refund, reversal and reconciliation after missed webhooks. Package entitlement enforcement and advanced product features are separate future work.

Current plan changes require canceling and waiting for the paid period to end. Immediate prorated switches and annual plans are not implemented. A creation stalled without a subscription ID for over 70 hours requires operator review before retry: locate its checkout `custom_id` in PayPal rather than risk a duplicate subscription.

## Payment behavior prepared for later

A return URL or ACTIVE subscription alone does not grant paid status. The server validates linked checkout ownership, plan, settled transaction amount/currency and paid period. A canceled subscription retains its verified paid period. Full refunds and reversals block the associated payment; partial refunds retain the period. Duplicate events are recorded transactionally, and processing failures return an error for PayPal retries. The browser receives no credentials, tokens or raw provider responses.

The signed webhook subscribes to subscription activated/updated/cancelled/suspended/expired/payment-failed and sale completed/refunded/reversed. Reconciliation runs every six hours only when app credentials exist. Credential/network errors are reported without printing provider bodies or personal details. Sandbox rows cannot grant live paid status.

Sources: [subscription integration](https://developer.paypal.com/subscriptions/integrate), [Subscriptions API schema](https://developer.paypal.com/api/subscriptions/v1/schema.json), [signature verification](https://developer.paypal.com/api/webhooks/v1/verify-webhook-signature-post), [subscription events](https://developer.paypal.com/subscriptions/webhooks/).
