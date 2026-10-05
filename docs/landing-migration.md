# AtlasPay landing migration

The public `/` route now renders the Atlas landing page in both development and production. The dashboard and gallery remain development-only at `/preview` and `/preview/gallery`.

## Ported surface

- Responsive header and section links, dark hero and three-card fan.
- Three visual variants from AtlasPay: lime subscriptions, paper travel, graphite premium.
- Tariff comparison layout, three-step explanation, service principles, keyboard-accessible FAQ and footer.
- Russian dictionaries, shared card visuals, CSS Modules, Mantine controls and thin Next routes.
- `/account?tariff=<variant>` retains the selected visual concept in the URL, including reload. Unknown or repeated values are ignored. This is an entry placeholder, not an authentication session or card application.

Source: `../AtlasPay/web/landing/{index.html,landing.css,landing.js}`, `../AtlasPay/web/ui/acard.css` and existing local card components. No additional dependencies, original Node server or credentials were needed.

## Contract-dependent adaptations

Atlas has no public offerings/pricing/FAQ API yet. The three cards are visual concepts, not an assertion of active products. Pricing, fees, exchange rates and mobile-wallet availability are explicitly unpublished. No fabricated price or client-side charm rounding is used.

FAQ content is editorial launch information in the locale dictionary, not a simulated knowledge API response. The source's instant issuance, 10-minute rate lock, support SLA, closure refund policy, Telegram OTP delivery and payment-network logos were not migrated as promises; these depend on approved backend/provider behavior.

Primary actions route to the honest account launch state. Development additionally offers the existing dashboard demo; production never links to it. Future auth can consume the validated tariff query, but persistence across actual authentication is not implemented or claimed.

The original attribution storage and legacy `/api/public/tariffs`, `/api/faq`, `/app` requests are not copied. Public APIs and analytics require their own contracts before connection. No live request failure falls back to sample commercial terms.

## Verification

Run `bun lint`, `bun run test:run`, `PLAYWRIGHT_CHANNEL=chrome bun run test:e2e`, `bun run build`, then `PLAYWRIGHT_CHANNEL=chrome bun run test:production`.

Landing browser tests run at 375px, 768px and 1440px in both modes. They check overflow, navigation, keyboard FAQ behavior, selection handoff/reload, invalid selection, no business API traffic, no page errors and production exclusion of demo entry links. Existing dashboard/gallery tests cover shared card regressions; production tests retain preview route and bundle isolation checks. Screenshots are written under ignored `artifacts/screenshots`.

Verified on 2026-09-25: lint/typecheck/format checks, all 45 unit tests, 7 development browser tests, production build, 5 production browser tests and local skill validation passed. Mode-specific browser tests are intentionally skipped in the other mode. Mobile (375px) and desktop (1440px) screenshots were visually inspected.

Follow-up: `/account` is now the real authorization screen. The placeholder described above is historical; see [authentication](authentication.md) for current behavior and deployment configuration.
