# Architecture

Next App Router delegates to `views`; widgets are composed regions; features own user actions; entities own domain APIs and display helpers; shared contains generic UI and transport. Polymarket's `views` name avoids confusion with Next route files. Future generated Atlas contracts live under `src/generated/atlas`.

The current dashboard accepts a presentation snapshot, not an invented backend DTO. `src/preview` supplies deterministic snapshots to the public view. Only gated development route entrypoints import preview composition. Production renders the public landing at `/`, policy-driven authorization at `/account`, and returns 404 for preview routes. The webpack production configuration also replaces the two preview entrypoints by resolved module path to an unreachable null module, because RSC client discovery can retain dynamic imports despite a route guard. Browser tests verify both HTTP isolation and absence of fixture markers in emitted client chunks. Register the same exclusion for any new preview entrypoint. The preview boundary is independent of authentication. Authorization uses direct backend requests described in authentication.md; future protected business routes must validate the session with Atlas.

Providers initialize Mantine, React Intl, React Query, modals and notifications once. No Effector store is needed for local preview state. Query and mutation automatic retries are disabled until individual API semantics are known.

Available and reserved USD amounts are separate from card balance. API amounts are exact decimal strings in the stated currency. Arithmetic uses decimal.js; display formatting preserves fractional precision without converting money to JavaScript Number.

`src/shared/api/kyMutator.ts` retains generic reference serialization, cancellation and response decoding. `request.ts` has no assumed refresh or token storage policy. The pinned authorization schema and generated types are now included. Backend URL and tenant are public build configuration; the backend owns HttpOnly session cookies.

Selected local lint rules retain source tests. Additional restrictions keep generated contracts out of UI/feature imports. Next's accessibility checks remain enabled; the reference's disabled accessibility rules were not copied. Prettier owns formatting.

Pending directories such as features/generated are created when their actual implementations arrive, not filled with empty scaffolds.

`src/entities/auth` owns direct credentialed backend requests and expiring, non-secret transaction progress. React Query orchestration remains in Authenticate. The Go backend owns caller association, Origin enforcement and HttpOnly session cookies. The OAuth callback page calls Go directly; Next has no authentication API proxy. Tokens never enter browser storage.

Public page composition uses themed Mantine controls and shared primitives (`BrandLink`, `PageContainer`), composed navigation widgets (`PublicHeader`, `PublicFooter`), and `PublicLayout` as the page template. Landing, authorization and launch views supply only page content. `PageContainer` owns the 1120px outer maximum and responsive 24px/16px gutters; views must not independently recreate these constraints. Page-specific panels and content widths remain inside that shared frame.

The cabinet at `/cabinet` is a single-page composition with an avatar menu and dialogs for support, account top-up and issuance. The avatar menu and profile share the logout feature: confirmed browser logout cancels pending auth and private reads, marks both session gates signed out, clears private caches and replaces the route with `/account`. Failed logout retains the account view and offers explicit retry. Profile opens on the separate `/cabinet/profile` page. Card selection opens a separate reloadable `/cabinet/card?id=<card-id>` page. Existing section routes remain compatible entrypoints into this composition. Wallet balance, crypto address acquisition and cursor-paginated account history use authenticated APIs. Owned cards use authenticated list/detail queries with client-scoped pagination, visible-tab polling, and explicit loading, empty and error states. Card cache is cleared on logout or session rejection. Unavailable profile actions stay explicitly labeled demonstrations. Profile KYC uses authenticated get/save, with encrypted backend persistence and a server-owned unverified level. Card-operation history reads actual provider transactions through the authenticated card-scoped API, using the shared history surface and a separate private card query. Sensitive card requisites use a fresh detail read on explicit reveal, stay in mounted feature state outside React Query data, and are discarded on hide or unmount. See cabinet-migration.md for navigation, Telegram configuration and verification.

The cabinet mounts private widgets only after a fresh backend session check. A balance or payment authentication rejection closes the entire private view, including dialogs, and cancels and removes payment and balance queries. Session checks repeat while the page is visible and on window focus; a failed session check hides account data until verification succeeds. Signed-out sessions redirect to `/account` using history replacement after private caches are cleared. Transient session-check errors remain retryable without redirecting. Browser tests for authenticated cabinet flows explicitly establish a fixture session.

Card issuance is owned by `features/IssueCard`, with transport and status models behind `entities/card`. The cabinet composes selection and the submission/progress view. React Query uses the private `card` cache namespace; mutations never retry automatically. The displayed split quote accompanies a retained request key. Progress survives tariff-query failures and reloads through the backend current-request endpoint. Provider identifiers and operator evidence never enter customer UI data.

Card types use exact stable strings with no alias rewriting. The tariff response owns each type's optional name and palette (six-digit hex background and foreground). Landing, authentication, issuance, and owned cards use these settings; missing settings use neutral artwork. Existing CATEGORY_* IDs remain valid. The backend privately resolves provider program and offering references from the selected ID.

Owned-card artwork uses the issued card name on the front, with balance visibility independent of requisites. Both faces retain the same card aspect ratio. The reverse has a magnetic stripe and copyable number, holder, MM/YY expiry and CVV, with a hide icon control. Requisites are fetched on reveal; successful reads have no refresh control. Failed or unavailable reads offer an explicit retry. Missing fields cannot be copied; a missing holder is omitted. Hiding returns keyboard focus to the front reveal control and unmounts credentials. Card-type palettes remain backend-owned.

Card issuance now exposes a finalizing step before completion. Requisites are stored encrypted by the backend and backfilled for existing cards; reveal reads stored values. Billing details below the card reverse have separate copy controls for address lines, city, region, postal code and country. Country names are shown in English for checkout forms; postal codes retain leading zeros. Missing snapshots remain unavailable until backfill; balance reads stay live. Generated holder/address values are stable per card.

Payment details show receipts only for every payment type, with no progress tab, bar or stage list. Issuance progress is accessed by tapping the pending card in the cabinet. That card shows compact progress and disables new issuance until the current request is terminal. Completion removes the pending card and hides issuance progress. Accepted top-ups close their form and poll silently without progress UI or automatic dialog reopening. Nullable protobuf completion timestamps are treated as absent; malformed non-null timestamps remain rejected.

Card requisites are gated by the backend on each detail request: only a successfully
read positive live card balance permits number, CVV, expiry, holder and billing
address. Zero balance shows a locked message on the existing card reverse and
points to the existing top-up action below it, without a duplicate funding button.
Unavailable balance offers retry and is never presented as zero. Reveal reads use
the balance from that same response; credentials remain outside query/mutation
caches. A changed card balance remounts the reveal feature, clearing credentials
and fetching current permission. Confirmed top-ups already invalidate card detail
queries; only a positive provider balance unlocks requisites.

SBP account top-up uses the DepositBalance-owned private SbpDeposit component and payment-entity adapters/hooks. Generated OpenAPI types remain behind the entity boundary. The existing desired USD input drives an automatic server quote on SBP selection; there is no second RUB form. Server quotes own payable RUB, included fee, one Bybit rate read and USD credit for 30 seconds; provider cost is private to the backend. Unknown creation results retain their preview identity for manual retry. Private payment queries stop on unmount/session rejection and use no background polling. Checkout links are never persisted in browser storage. Mobile and desktop browser tests use explicit fixtures, not live provider payments.

SBP quote presentation emphasizes the total RUB payment, followed by USD credit. The displayed approximate rate is total RUB divided by actual USD credit, rounded to two decimals, including the Atlas fee. The quote omits the separate fee row and raw Bybit rate. A red clock and numeric countdown show the server quote expiry; payment creation removes the countdown. Financial amounts, tariffs and accounting remain backend-owned.

Selecting USDT replaces the method picker with a dedicated CryptoDeposit modal view, mirroring SBP navigation. It requests an address once after mounting, with one retained key for retries, and shows transfer details, QR and the copyable address. Back returns to the payment-method picker with the desired amount intact; acknowledgement closes the dialog without claiming payment confirmation.

SBP selection automatically quotes and creates one order per preview, guarded against React Strict Mode effect replay. The private SbpQr child reads the owned payment QR through the payment entity, renders a locally generated NSPK QR and bank link, and hides them at provider expiry. This access state is independent of the existing payment status query. QR errors retain Checkout access; terminal status unmounts the QR query. The frontend never sends QR requests directly to PayHot or saves access in browser storage.

SBP history uses PAYMENT_TYPE_DEPOSIT with frozen USD credit and no crypto requisite. Crypto history remains USDT with crypto funding instructions when present. The payment boundary accepts mixed history pages, while USD crypto instructions and malformed monetary values remain invalid. History and detail views share PaymentIcon, display the SBP logo and method label, and omit a separate Atlas fee for SBP. Completed SBP receipts expose creditedAmount; pending and failed receipts do not claim a balance credit.

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

Profile email uses a compact settings row: quiet label, readable address, mail icon
and an inline checkmark status. At 375px, status moves below the address without
truncating it. Visuals inspected at 375px and 1440px; the three profile-email
browser checks, focused unit tests and frontend lint passed on 2026-10-09.
