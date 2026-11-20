# Tranquila Cloudflare test migration

The live Main and Nest menus remain on Vercel. No custom domains, DNS, production branches, Supabase records, or Vercel project settings are changed by this migration.

## Test targets

| Property | Worker | Branch ID |
| --- | --- | --- |
| Main | tranquila-main-test | tranquila |
| Nest Kado | tranquila-nest-test | tranquila-nest |

Account: `75d74b2148c26e94da25edd537beb5d9`.
Workers subdomain: `tranquila-hotels.workers.dev`.
The intended test URLs are `https://tranquila-main-test.tranquila-hotels.workers.dev` and `https://tranquila-nest-test.tranquila-hotels.workers.dev`. These URLs are only usable after successful deployment; configuration alone does not deploy them.

This Next.js 15 application uses server-rendered pages and API routes. OpenNext adapts the existing Next.js build for Workers without replacing the application framework. Ordinary static Pages hosting would omit ordering and staff API functionality.

## Build and deploy

Only deploy on the Workers Free plan. Do not enable paid subscriptions or metered add-ons. Confirm the account plan in the dashboard before the first deployment: the OAuth connector cannot read billing subscriptions, and `default_usage_model: standard` alone does not prove that the account is free. Observability is disabled in the test configuration to avoid log ingestion and storage usage.

Use only Git branch `migration/cloudflare-test`, directory `Tranquila-Menu`, Node.js 24, and `npm ci`.

Main build/deploy: `npm run deploy:cloudflare:main`.
Nest build/deploy: `npm run deploy:cloudflare:nest`.

Build each property separately: Next.js embeds NEXT_PUBLIC variables at build time. The build helper pins each branch ID and all navigation URLs to the test hosts, so a test branch switch cannot send staff to a live admin.

For Workers Builds use `npm run build:cloudflare:main` / `npm run build:cloudflare:nest` as the respective build commands, then `npx opennextjs-cloudflare deploy` / `npx opennextjs-cloudflare deploy --env nest` as the deploy commands. Restrict automatic builds to `migration/cloudflare-test`.

## Environment configuration

Copy these from the corresponding Vercel project into each Worker's runtime environment and build environment as appropriate:

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (needed at build and runtime)
- `SUPABASE_SERVICE_ROLE_KEY` (runtime secret only; never NEXT_PUBLIC or committed)

Vercel marks the service-role key sensitive and does not return its value even with decrypt enabled. The owner must add it directly as a Cloudflare secret from the existing Supabase configuration. Do not rotate it during migration.

Keep runtime `CLOUDFLARE_TEST_READ_ONLY=1`. The test guard permits menu reads, staff login, and server order validation; it blocks every other admin mutation, including uploads, password reset emails, password changes, publishing, stock switches, and settings. Test pages have an X-Robots-Tag noindex header. Production behavior is unchanged when this flag is absent.

Existing Supabase remains the backend. This migration does not move the database or uploaded images. With a missing service key the existing code uses starter menu fallback; this is not proof of live-menu parity and must not pass acceptance.

## Acceptance before moving traffic

- Deploy both Workers with the correct property ID and credentials.
- Compare /api/menu responses for each property against its live Vercel URL, including items, prices, availability, opening hours, and WhatsApp number.
- Check homepage, /browse, /admin, image and font loading on mobile and desktop.
- Verify wrong-branch API requests fail and branch navigation stays on test hosts.
- Verify cart totals, options, ₦200 room delivery and free collection; inspect the generated WhatsApp link without sending a real order.
- Verify staff login and read-only workspace loads. Confirm writes are blocked on the deployed runtime.
- For publish/stock/upload/reset testing, use a separate Supabase test project or branch with test staff credentials, then disable the write guard on that isolated backend only. Never test these writes against live hotel data.
- Compare current live Vercel deployment IDs and DNS before/after test deployment.

## Current external setup blockers

Cloudflare's Git connection API reports that this account is disconnected from GitHub. Authorize the Cloudflare Workers GitHub integration for `exorcist-coder/Tranquila-Menu-` in the Cloudflare dashboard before configuring Workers Builds, or deploy the prepared branch with an authenticated local Wrangler CLI.

The service-role key must be entered directly as a Cloudflare secret before the database-backed tests can pass.

## Cutover and rollback

Do not merge into main or attach custom domains during the test. After acceptance and the owner's approval, record the current DNS targets, connect the exact existing Main/Nest hostnames to their respective Workers, and verify existing QR URLs and routes still work. Keep Vercel deployments available. Roll back traffic by restoring the recorded DNS targets; do not delete Vercel or modify Supabase during rollback.
