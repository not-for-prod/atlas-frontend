# Direct browser authentication

The browser calls Atlas directly with `credentials: include` and `X-Atlas-Session: cookie`. Next serves pages and the OAuth callback page, but does not proxy API requests or hold session credentials.

## Configuration

- `NEXT_PUBLIC_ATLAS_BACKEND_URL`: backend origin, locally `http://localhost:8080`.
- `NEXT_PUBLIC_ATLAS_AUTH_TENANT`: tenant, locally `atlas`.
- Backend `Authentication.Origin` and `Service.CORS.AllowedOrigins`: exact frontend origin, locally `http://localhost:3001`.
- Backend CORS permits GET, POST, OPTIONS and Content-Type/Authorization/X-Atlas-Session, allows credentials and exposes Retry-After. CORS must wrap authentication so errors and preflights receive CORS headers.

Use the same hostname locally; do not mix localhost and 127.0.0.1. Deploy the frontend and API on the same site with HTTPS so SameSite=Lax cookies are sent. Public Next variables are compiled into the browser bundle: rebuild after changing them. No frontend session secret is needed. Existing Next session cookies are no longer used; sign in again after migrating.

Register OAuth redirect URLs at `<frontend-origin>/auth/callback/{google|yandex|mailru|telegram}`. The callback page reads state/code, removes them from the address bar, calls the Go callback directly with the backend caller cookie, and navigates to `/account`, which validates the session and redirects to `/cabinet` once initialization completes. It never puts tokens in URLs. Keep ingress callback query strings redacted; callback pages send Referrer-Policy: no-referrer. Telegram still requires HTTPS.

## Requests and session ownership

The auth entity bootstraps `/auth/caller` once before concurrent policy/session reads. It then uses `/v1/tenants/{tenant}/auth/policy`, transaction creation, transaction reads, `:startMethod` and `:verifyMethod`. Policy and available methods remain backend-owned. A satisfied policy is not an issued session. Email verification preserves partial progress; commands never retry automatically.

The Go backend issues `atlas_session` (or `__Host-atlas_session` over HTTPS), an HttpOnly, SameSite=Lax cookie with backend session expiry. Browser-origin verification responses omit the bearer token while retaining session metadata; browser callbacks return `authenticated`. Non-browser API clients retain the bearer response/header contract. No credential is stored in browser localStorage/sessionStorage. Only expiring transaction IDs and tariff selections are stored in sessionStorage for reload and OAuth recovery; backend caller association still authorizes every transaction operation.

`GET /client` validates the cookie. Only the exact 503 `client initialization pending` condition triggers authenticated initialization polling. Other failures remain errors. Invalid sessions clear the backend cookie. `POST /auth/logout` requires the trusted Origin and clears this browser cookie; it does not revoke the backend credential. Refresh and server-side revocation remain unsupported. Future protected operations must validate the backend session independently.

## Verification

Run `bun lint`, `bun run test:run`, and `PLAYWRIGHT_CHANNEL=chrome bun run test:e2e`.
For production browser tests build with `NEXT_PUBLIC_ATLAS_BACKEND_URL=http://127.0.0.1:3112 NEXT_PUBLIC_ATLAS_AUTH_TENANT=atlas bun run build`, then `PLAYWRIGHT_CHANNEL=chrome bun run test:production`. Rebuild with deployment settings before serving production.

The isolated test backend implements credentialed CORS and HttpOnly cookies. Browser tests verify requests go directly to the backend, email login/reload/logout, partial verification, rate limits, initialization and OAuth. They do not establish live SMTP delivery or provider consent. The pinned generated schema remains the upstream authorization contract; Atlas's host cookie and callback behavior is documented here and in the backend authentication documentation.

## Auth page presentation

The page uses a unified desktop card and a single-column mobile form. Provider buttons include decorative Google, Yandex, Mail.ru and Telegram icons, readable labels and redirect indicators; only backend-enabled methods are shown. Sign-in and registration remain separate actions. Email appears first with a visible address field, a plain divider and «Продолжить с email», followed by the enabled provider buttons. Submitting the email starts the existing challenge and opens code verification directly. Passwordless helper text appears below the choices.

The redesign was visually reviewed at 375px and 1440px. Browser checks cover icon visibility, keyboard activation, responsive overflow and the existing email/OAuth flows. Screenshots are saved in `artifacts/screenshots/auth-oauth-375.png` and `artifacts/screenshots/auth-oauth-1440.png`.

OAuth callbacks return HTTP 404 with `{"error":"account_not_found"}` only when the engine has verified an identity but sign-in has no registered account. The browser clears that failed flow, preserves the tariff and offers explicit registration. Generic provider, state and storage failures retain the generic callback error. Registration starts a new transaction only after the user selects a provider.

## Account deletion

The profile action confirms permanent loss of access, then opens `/account?intent=delete`.
The existing verification UI sends `INTENT_DELETE` through the authentication package.
It requires a current session and fresh proof belonging to the same user. Successful
delete has a result without a session; the backend clears its cookie, the frontend
clears its query cache and redirects through a full page load to sign-in. OAuth uses
the same callback path and reports `deleted: true`. Frozen completion retry retains
only the original attempt/challenge or callback association, never verification codes
or bearer tokens. Commands are retried explicitly.

Atlas retains clients, balances, cards and history. All later protected requests reject
a missing canonical auth user. Registering again creates fresh ownership and zero
balances. No provider account deletion, refund or card closure is triggered.

## Profile email

The profile Email section reads the authenticated `/auth/profile/email` contract:
verified email or an explicit empty email with `verified: false`. Request failures
show an error, never the add-email state. Existing email and trusted OAuth metadata
are displayed without sending a code. OAuth metadata does not enable email login.

Users without an email enter an address and code in the shared registration form
controls. The feature uses authenticated `INTENT_UPDATE`, retains the original
transaction/attempt references for retries, and shows success only after a protected
read confirms persistence. No replacement session or signup navigation is required.
An authentication rejection is checked against the protected read to distinguish
wrong code from session loss. Private profile-email queries are cleared on logout
and access loss; modal progress is local and discarded on cancellation/unmount.
Resend uses the existing limiter and a visible cooldown. Email replacement/removal
is outside this flow; KYC fields are independent.

Email code confirmation returns HTTP 404 with `message: "account_not_found"` after a valid proof when no account exists. The UI displays the registration message and offers explicit sign-up. Generic transaction 404 errors retain the expired-flow message. Deploy this mapping with the authorization library update.
