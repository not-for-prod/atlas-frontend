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
| Profile KYC                 | Connected: GET `/v1/kyc/level`, PUT `/v1/kyc`                          | Enable KYC and configure encryption key; collection does not verify identity         |
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

Profile KYC reads only the server-owned level through authenticated `GET /v1/kyc/level` and collects identity data through `PUT /v1/kyc`. No client ID or level is writable. Both unverified and verified levels are supported. Reads do not return personal fields or data-presence metadata. Unverified clients can open the collection form; verified clients see their level without a collection action. After a successful save, confirmation is shown for the current visit; reload reads only the level and cannot infer submission status. Reads and mutations use no automatic retries; failed saves preserve in-memory edits. KYC caches are removed on session rejection/logout and when inactive; data is never stored in browser persistent storage. The backend returns 503 when KYC is disabled.

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
failures never become empty success or fixtures. Rows open a card-operation detail modal from the current card-scoped history response, showing type, status, merchant, exact amount, optional fee/settlement, timestamp and full operation ID. Selection follows refreshed history data and is scoped to the selected card; missing values remain unavailable.
Timestamps with explicit offsets are localized; other provider time text is preserved.
Closure remains disabled; the obsolete unavailable-actions text is removed.
Gateway and browser fixtures verify the contract, but authenticated live-provider history
and its page/time/order conventions still require a smoke read.

Account balance top-up starts with a desired USD amount (positive, at most two fractional digits), then displays the payment preview and methods before requesting an address. The USDT/TRON preview follows the approved backend rule documented in `../atlas/docs/crypto-deposits.md`: 1:1 USD credit without an Atlas fee. Sender-wallet network fees are separate and unknown to Atlas; the receiving address must receive the displayed USDT amount. This is an indicative transfer calculation, not a locked quote or a payment order. The entered amount is not sent to the address endpoint; actual receipts determine balance credits. SBP remains unavailable. Payment tariff placeholders do not configure fees or activate methods.

Payment-preview verification (2026-10-05): `bun lint`, all 219 unit/regression tests, and `bun run build` passed. Six focused deposit browser checks passed at 375px and 1440px, covering amount entry, preview, keyboard focus, Escape/focus return, unavailable-service retry and QR decoding. Screenshots are in ignored `artifacts/screenshots/deposit-{amount,preview}-{375,1440}.png`. The broader cabinet run passed history and legacy routing checks; its two navigation tests reached and passed the deposit checks but failed later at the unchanged profile notification-switch expectation in `e2e/cabinet.spec.ts:104`.

Card requisites are gated by the backend on each detail request: only a successfully
read positive live card balance permits number, CVV, expiry, holder and billing
address. Zero balance shows a locked message on the existing card reverse and
points to the existing top-up action below it, without a duplicate funding button.
Unavailable balance offers retry and is never presented as zero. Reveal reads use
the balance from that same response; credentials remain outside query/mutation
caches. A changed card balance remounts the reveal feature, clearing credentials
and fetching current permission. Confirmed top-ups already invalidate card detail
queries; only a positive provider balance unlocks requisites.

Balance-gated requisites verification (2026-10-06): frontend lint, all 227 unit
tests, production build and all four card-requisites browser checks passed.
The browser checks cover positive-balance reveal, zero-balance lock, live balance
changes, one existing top-up action, modal Escape/focus return and card-hide focus
at 375px and 1440px. Reviewed screenshots are in ignored
`artifacts/screenshots/card-balance-locked-{375,1440}.png`. These are synthetic
browser fixtures, not a live provider check. The UI skill now records the reusable
rule to reuse an existing nearby action instead of adding an equivalent control.

SBP account deposits are connected to POST `/v1/payments/sbp/previews`, POST `/v1/payments/sbp`, and GET `/v1/payments/sbp/{payment_id}`. Clients enter their desired USD top-up once, then select SBP. Selection automatically sends `usdAmount` to the preview endpoint, with no additional RUB form. The backend uses the Bybit RUB/USD rate and both tariffs to calculate the smallest payable RUB amount including the client fee. Rate, fee, provider cost and payable amount freeze together for 30 seconds; the frontend displays the returned quote and its USD credit. Focus and reconnect do not silently refresh it; an expired unaccepted quote requires explicit refresh before automatic admission. Selecting SBP automatically admits the valid quote once. Creation retries retain the same preview ID, including after a timeout; no automatic mutation retries run. The full HTTPS checkout link is opened with no referrer. Poll the saved order every five seconds while visible, stopping on completed/failed, and invalidate balance/history on confirmed completion. Payment confirmation does not claim completion of asynchronous balance credit. Backend-disabled responses remain explicit errors with no fixture fallback. Backend SBP requires live PayHot credentials, linked tariffs, migrations, authentication and Redis. PayHot browser requests omit optional payer IP; supplied IP values remain validated and Wata still requires a valid IP for new creations. Quote/payment references and checkout access are held only for the mounted flow; reload does not automatically resume an SBP order. Crypto fee, exchange-rate and network details appear only after explicit crypto selection.

Direct SBP QR uses authenticated GET `/v1/payments/sbp/{payment_id}/qr`. It renders the exact NSPK URL locally, polls pending/preparation errors every five seconds while mounted and visible, and removes bank access at provider expiry or terminal payment status. Checkout remains the fallback. PayHot must enable direct access for the live key/register. Quote admission is automatic on SBP selection, with manual retry preserving the original preview after an unknown result. No automatic replacement order is created on QR expiry.

SBP history uses PAYMENT_TYPE_DEPOSIT with frozen USD credit and no crypto requisite. Crypto history remains USDT with crypto funding instructions when present. The payment boundary accepts mixed history pages, while USD crypto instructions and malformed monetary values remain invalid. History and detail views share PaymentIcon, display the SBP logo and method label, and omit a separate Atlas fee for SBP. Completed SBP receipts expose creditedAmount; pending and failed receipts do not claim a balance credit.

SBP history contract verification (2026-10-07): all 267 frontend tests and five focused payment-detail browser checks passed. Mixed crypto/SBP history, mobile/desktop rendering, failed receipt semantics, keyboard opening, Escape and focus restoration were checked. The corrected backend response omits crypto instructions for SBP and exposes confirmed credited money only after completion. The API-boundary skill now requires mixed-variant list/detail regression coverage; local skill validation passed. Browser fixtures are synthetic, not live payment-provider verification.

Final frontend lint and production build passed for the SBP history contract correction. The running backend must load the updated list/detail mapper; no live backend process was restarted by this task.

KYC phone clarification (2026-10-08): the collection form does not ask for or submit
a phone number. Atlas generates a stable synthetic Russian-format `+7` number for
provider KYC. The legacy API phone field is deprecated and ignored.

## Profile email contract

Implemented as host auth transport, outside the business OpenAPI client:
GET `/auth/profile/email` returns `{email: string, verified: boolean}` and requires
the current session. Linking uses existing transaction endpoints with
`INTENT_UPDATE` and `email_code`. Deploy the backend migration and authorization
library revision together before using this UI. A failed read is not absence.
