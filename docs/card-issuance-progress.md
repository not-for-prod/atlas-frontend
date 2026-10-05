# Card issuance progress

Owner-approved five-step progress is read from the order API: reserve funds,
register with provider, verify identity, fund provider account, issue card.
`stage` and ordered `steps` are additive fields generated from Atlas OpenAPI.
The backend owns step statuses and optional completion timestamps. The UI counts
completed steps for the bar; this percentage is not an estimated completion time.

IssueProgress is a private IssueCard child. It renders semantic ordered list rows,
current-step ARIA markers, completion checks, failed-step labels, and absent-history
messaging. Existing status alerts, monetary values and submission identity remain.
The URL retains the issuance ID for owner-scoped reads after reload, even when a
terminal order is absent from the active-only `/current` response. The main cabinet
reopens its tracked issuance modal. Closing the tracked modal clears the pointer.
No credentials, provider IDs or progress facts are stored in browser persistence.

Backend source: ../atlas/docs/event-storming/card-issuance-progress.md and
../atlas/spec/017-card-issuance-progress. Progress columns are on card_issue_order;
no additional tables or provider operations were introduced.

Verification: frontend lint/type/style/format checks pass; unit suite has 28 passing
files and 178 tests. Four new progress tests cover registration vs KYC, funding
failure, historical unknown failed stage and complete journey. Browser checks cover
375px and 1440px polling, reload, terminal detail lookup with empty current response,
no page overflow, and Escape close. Existing issuance response-loss/idempotency and
completion/reload browser regressions also pass. Production build passes; skill
references validate. Screenshots in artifacts/screenshots/issuance-progress-*.png
use authenticated fixture requests and are not evidence of live provider execution.

## Approved visual design

On 2026-10-01 the owner approved the feature after reviewing three frontend
options. Delivery timeline is the selected design: connected vertical milestones,
lime completion checks, a dark current-step marker, and a five-segment completion
bar. Failed steps keep their explicit red label while earlier completed segments
remain lime. Existing status alerts continue to explain monetary outcomes.

After visual approval, full frontend lint, the four journey unit tests, all five
issuance browser checks, and the production build passed again. Mobile and desktop
screenshots were refreshed for the selected timeline. These remain fixture-based
checks; live provider issuance was not triggered.

## Cabinet pending-card interaction (approved 2026-10-05)

The current nonterminal issuance appears as a card in My cards with a compact server-derived segmented progress bar. New-card creation is disabled until the current issuance is terminal. Tapping or keyboard-activating the pending card opens the existing issuance details and full stage timeline; closing restores focus. The cabinet polls the current issuance while visible and restores the pending card after reload. On completion the pending placeholder disappears, owned cards refresh, and issuance progress bars and stage lists are hidden, including payment details. Silent top-ups have no progress UI; see card-top-up.md.

Verification for the 2026-10-05 interaction: final lint and production build passed, and all 219 unit tests passed with two workers. Thirteen focused browser scenarios passed across the final runs, covering pending-card details, keyboard focus, closing and reloading, completed issuance, response-loss recovery, payment details and silent top-ups at 375px and 1440px. Screenshots are in `artifacts/screenshots/pending-card-details-*.png` and `top-up-silent-*.png`. These checks use authenticated fixtures; no live provider operation was triggered.
