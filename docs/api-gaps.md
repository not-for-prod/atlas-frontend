# API readiness

| Feature                     | Status                                                                 | Needed before live integration                                                       |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Dashboard visuals / gallery | Development gallery                                                    | No API needed to review components                                                   |
| Email login                 | Connected directly with backend cookies                                | Deployment settings and live SMTP smoke test; see authentication.md                  |
| Client balance              | Connected: `GET /v1/balances`                                          | Cookie session; exact USD decimal strings; loading, sign-in and retry states         |
| Browser OAuth               | Connected through browser callback                                     | Provider credentials and callback registration; live consent smoke tests             |
| Card tariffs                | Connected: `GET /v1/cards/tariff`                                      | Configure the card tariff ID; issuance and owned-card lifecycle remain separate      |
| Card issuance               | Connected: POST `/v1/cards`, GET `/v1/card-issues/{id}` and `/current` | Configure backend provider routes, master account, split prices and KYC requirements |
| Card top-up                 | Connected: quote, submit and owner-scoped progress                     | Active USD cards; backend provider configuration                                     |
| Card closure                | Not connected                                                          | Backend lifecycle and recovery implementation                                        |
| Profile deletion            | Connected through auth DELETE                                          | Confirmation, same-user verification, retained business data                         |
| Profile KYC                 | Connected: state, contacts and Didit verification                      | Enable KYC, publish Didit workflow and configure webhook/return URL                  |
| Telegram Mini App           | Contract missing                                                       | `initData` flow; browser Telegram OAuth is not sufficient                            |
| Landing                     | Live card descriptions and fees                                        | No fixture fallback on empty or failed tariff retrieval                              |
| Admin                       | Deferred                                                               | Server permissions and admin contracts                                               |

Atlas source references: `../atlas/docs/authentication.md`, `../atlas/docs/money-model.md`, `../atlas/docs/domain-model.md` relative to UI root.

Authentication uses browser association cookies and Origin checks; `/client` requires a bearer session. The reference product's CSRF cookie, refresh endpoint and generated error type are not reusable contracts. Some host errors are plain text. HTTP 503 with `Retry-After: 1` and the explicit initialization condition differs from a generic service failure.

Authorization now uses the pinned schema, backend-owned HttpOnly sessions and `/client` for session validation and initialization status. Balance, crypto address requests and payment history use authenticated backend endpoints. Logout calls the backend to clear this browser cookie; Atlas currently exposes no revocation or refresh endpoint. Card and financial flows remain independent tasks. Fixtures never fill in for live failure.

Cabinet wallet balance uses PaymentService.ListBalances and refreshes every 15 seconds while the tab is visible, on return to the tab, and on manual refresh. Polling stops when the balance view unmounts. Missing client/asset returns 404; the wallet shows a retryable error until signup provisioning completes. Owned cards use authenticated cursor-paginated `GET /v1/cards` and owner-scoped `GET /v1/cards/{card_id}`. Missing card balances show unavailable states. Card top-up is connected for active USD cards; closure remains unavailable. Issuance submits the displayed price and commission, retains one idempotency key for retries, polls persisted progress and resumes the active request after reload. Money amounts remain decimal strings. Regenerate with `ATLAS_OPENAPI_FILE=contracts/atlas.swagger.json bun codegen`.

Crypto deposits now use `POST /v1/payments/crypto-deposit-addresses` with a client-generated idempotency key, currency USDT and network tron. No mutation retries run automatically. A manual retry retains its request key. `GET /v1/payments` supplies cursor-paginated history, refreshed every 15 seconds while visible and on demand. Amounts are decimal strings of actual USDT values. Verified pending, inspection, completed and failed deposits are persisted and exposed in history. Only completed deposits credit USD asynchronously, once per deposit, at the approved 1:1 conversion with USD credit truncated to two decimal places. History shows provider status, not completion of the later balance consumer. WestWallet must be enabled and configured on the backend; disabled/unavailable calls show errors rather than fixtures. Full reload starts a new explicit address request.

Card pricing belongs to VirtualCardService. PaymentService exposes its own `/v1/payments/tariff`; the frontend does not read a shared all-service tariff endpoint. Category IDs survive selection and authentication; unknown live IDs use neutral artwork.

Telegram support is connected to public `GET /v1/support`. The backend owns the account URL in `Support.TelegramURL`; empty, failed, or invalid responses leave the link disabled.

Payment-history rows open a detail modal using authenticated `GET /v1/payments/{payment_id}`. It refreshes every 15 seconds while open and visible; closing disables polling. The card displays status, exact original amount, timestamps, destination, memo, and ID. Fee and credited amount display only server-provided money; absent values explicitly say “Не указано”. The current crypto-history projection does not populate either field; no fee or balance-credit result is inferred from completion status.

Profile KYC reads authenticated `GET /v1/kyc`; card-specific eligibility uses
`?cardTypeId=...`. `PUT /v1/kyc/contacts` saves only email, without claiming
ownership verification. Passport collection is removed. The profile shows status
and contacts in a modal; starting identity verification requires choosing a card.
The catalog's explicit `requiresKyc` flag gates the issuance form. A missing or
malformed flag makes the catalog unavailable; it never defaults to an exemption.
Cards without KYC make no KYC requests. Their progress omits the identity step.

For a required card, `POST /v1/kyc/verification` creates or reuses the backend
session. The browser follows the returned HTTPS URL in the same tab. Configure
backend `KYC.Verification.Didit.ReturnURL` to the frontend's `/kyc/return` URL.
The callback restores only a public card selection from sessionStorage, then
returns to `/cabinet/issue?tariff=...` (or profile if no selection is retained).
Callback parameters cannot approve verification. Active states poll every three
seconds while visible, refetch on focus and stop polling on errors or terminal
states. Errors expose an explicit refresh/retry. A lost start response triggers
an authoritative state read; continuing an existing session does not create one.
Only backend `eligible: true` unlocks the issuance form, and the user must then
explicitly confirm issuance. Existing orders remain available independently of KYC.

KYC state and HTTPS session URLs stay only in the private, inactive-immediately-
evicted React Query cache. Contacts stay in the mounted form and transient
mutation; no documents or session URLs enter browser persistent storage. The
only retained workflow value is the public card type ID. Authentication rejection
closes private views and clears KYC queries through the account gate. No live
Didit session, real passport upload or provider card issuance was used in UI tests.
The OpenAPI snapshot's KYC definitions and tariff flag come from the approved
atlas-backend generated Swagger; `bun codegen` cleans stale generated models.

Issuance stays unavailable when the backend is disabled; the cabinet never simulates success. Tariff failure does not unmount an existing issuance request. Customer-confirmed price and commission are sent as exact USD-cent strings; a stale quote is rejected before reservation. Unknown paid outcomes remain reserved for an operator. Backend provider polling and evidenced fee reconciliation are described in the backend's `docs/card-issuance.md`.

Card types use exact stable strings with no alias rewriting. The tariff response owns each type's optional name and palette (six-digit hex background and foreground). Landing, authentication, issuance, and owned cards use these settings; missing settings use neutral artwork. Existing CATEGORY_* IDs remain valid. The backend privately resolves provider program and offering references from the selected ID.

Card requisites are connected to the detail-only `GET /v1/cards/{card_id}` response. Explicit reveal performs a fresh read; number, CVV, expiry and holder are held only in the mounted reveal feature, outside query and mutation data. Hide, card navigation, reload and account-gate unmount discard them and abort pending reads. Missing fields display dashes; missing requisites and failures have explicit unavailable/error states with retry. Successful requisites reads have no refresh control. Reveal errors retain their authentication classification for the shared account gate. No credentials are stored in browser storage or list responses.

Card issuance now exposes a finalizing step before completion. Requisites are stored encrypted by the backend and backfilled for existing cards; reveal reads stored values. Billing details below the card reverse have separate copy controls for address lines, city, region, postal code and country. Country names are shown in English for checkout forms; postal codes retain leading zeros. Missing snapshots remain unavailable until backfill; balance reads stay live. Generated holder/address values are stable per card.

Telegram payment notifications use authenticated GET/PUT `/v1/notifications/settings` and POST `/v1/notifications/telegram:start` and `:complete`. Default preference is enabled; promo dismissal persists false. The promo is the first cabinet content section; its whole surface links to profile notifications, with no separate connect button. The independent X control saves the disabled preference without navigating. The connection callback at `/auth/notifications/telegram` uses the existing backend cookie session and returns to profile. It never signs into another account. The generated snapshot includes NotificationService. Telegram requires profile and messaging consent; existing OAuth subjects alone are insufficient. Enable backend Notifications and configure the same bot's token; register the callback in BotFather.

Account payment history supports crypto deposits, card issuance and card top-ups. Card operations use their explicit payment types, USD charges, fees, outstanding reservation and released funds, with no deposit requisites. Card top-ups display as “Пополнение карты” in history and details; neither completion nor the charge amount is used to infer a credited card balance. The backend maps `deposit-card` receipts to `PAYMENT_TYPE_CARD_TOP_UP`.

Card-operation history is connected to authenticated `GET /v1/cards/{card_id}/operations`.
Atlas checks ownership and reads O-Plata's card transactions directly; these rows are separate
from wallet issuance/top-up payments. The card page shows provider types/statuses, merchant,
exact original-currency amounts, optional fees/settlement and transaction time. It uses
card-scoped continuation tokens, 15-second visible-page refresh, manual refresh and retries,
and clears history on session rejection/logout. Missing values are unavailable; provider
failures never become empty success or fixtures. Rows do not open wallet payment details.
Timestamps with explicit offsets are localized; other provider time text is preserved.
Closure remains disabled; the obsolete unavailable-actions text is removed.
Gateway and browser fixtures verify the contract, but authenticated live-provider history
and its page/time/order conventions still require a smoke read.

Account balance top-up starts with a desired USD amount (positive, at most two fractional digits), then displays the payment preview and methods before requesting an address. The USDT/TRON preview follows the approved backend rule documented in `../atlas/docs/crypto-deposits.md`: 1:1 USD credit without an Atlas fee. Sender-wallet network fees are separate and unknown to Atlas; the receiving address must receive the displayed USDT amount. This is an indicative transfer calculation, not a locked quote or a payment order. The entered amount is not sent to the address endpoint; actual receipts determine balance credits. SBP remains unavailable. Payment tariff placeholders do not configure fees or activate methods.

Payment-preview verification (2026-10-05): `bun lint`, all 219 unit/regression tests, and `bun run build` passed. Six focused deposit browser checks passed at 375px and 1440px, covering amount entry, preview, keyboard focus, Escape/focus return, unavailable-service retry and QR decoding. Screenshots are in ignored `artifacts/screenshots/deposit-{amount,preview}-{375,1440}.png`. The broader cabinet run passed history and legacy routing checks; its two navigation tests reached and passed the deposit checks but failed later at the unchanged profile notification-switch expectation in `e2e/cabinet.spec.ts:104`.

KYC frontend verification (2026-10-08): `bun lint`, `bun run build` and all 243
unit/regression tests passed. This host's Node 26 requires
`NODE_OPTIONS=--no-experimental-webstorage bun run test:run` for jsdom storage.
Playwright checks passed at 375px and 1440px: seven KYC scenarios, three issuance
scenarios, one catalog scenario, and six card-list/requisites scenarios. The KYC
flow checks page identity, populated UI, console errors, contact-modal keyboard
focus/Escape, responsive width, backend-only eligibility, same-tab Didit return,
no automatic issuance, no-KYC bypass and recovery after a lost start response.
Screenshots were visually inspected at `/tmp/atlas-frontend-kyc-qa/`.
Browser plugin was unavailable; repository Playwright used an installed headless
Chromium, the local app at `http://127.0.0.1:3100` and synthetic API/provider pages.
No real Didit session, document or card-provider request was submitted.

KYC contact update (2026-10-09): the form and PUT request collect only email.
Customer phone is absent from the frontend contract and backend identity storage.
The backend Oplata adapter supplies its fixed `OPlata.KYCPhoneNumber`; this value
is never sent by or exposed to the frontend. All 243 unit/regression tests,
`bun lint`, `bun run build` and seven KYC browser scenarios passed. The email-only
modal was visually inspected at 375px and 1440px, including keyboard focus, Escape
and focus return. Screenshots: `/tmp/atlas-frontend-kyc-email-qa/`. All provider
pages and API responses in browser tests were synthetic.
