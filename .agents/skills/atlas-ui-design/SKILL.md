---
name: atlas-ui-design
description: Design or adjust Atlas customer UI components, copy, responsive layouts and loading, empty, pending or error states using the existing Atlas visual language.
---

# Atlas UI design

Use the AtlasPay reference in `../AtlasPay/web/ui` relative to the project root, with current Atlas behavior taking priority over old product promises. Tokens live in `src/app/globals.css`; Mantine defaults in `src/app/providers/theme.ts`.

Keep Onest, paper backgrounds, white surfaces, black text, restrained lime accents, pill controls and large rounded cards. Customer screens start at 375px; retain a 2×2 action grid and readable balance hierarchy. Card artwork alone may use the reference's gradient/shadow exception. Do not add unrelated illustrations or a new visual theme.

Reuse the closest component before adding another. Keep Russian copy in dictionaries. Describe a person's next action clearly. For each data-dependent screen cover loading, empty, network failure, denied/unavailable, pending/unknown and confirmed success as applicable. Unknown monetary outcomes say “Проверяем результат”. Do not promise instant issuance, account merging or unconfirmed wallet capabilities.

Keep account funds, reservations and card balance visually distinct. Hide sensitive values by explicit controls; never place real card secrets in fixtures. Preview actions must explain that no operation occurs.

Use visible action text when a sensitive-data reveal could be confused with nearby refresh or visibility controls. Do not rely on a rotation glyph to communicate what data the action reveals.

Use native interactive semantics, accessible labels, visible focus and sufficient contrast. For progress indicators embedded in colored surfaces, use the surface’s contrasting foreground for completed segments and a muted treatment for remaining segments; verify both against every supported palette. Verify at 375px and desktop, including keyboard modal opening, Escape and focus return. Respect reduced motion. Keep visual review evidence in ignored `artifacts/` and record outcomes in docs when handing off a milestone.

Use shared spacing tokens for page gutters, panel padding and section gaps. Check cumulative page-plus-panel insets at 375px. Keep balance summaries compact: use tight label/amount spacing and an inline, wrapping row for secondary details instead of a separate divider and note footer. Keep cabinet headings, action tiles and decorative card artwork compact so balances, actions and recent activity remain easy to scan; promotional hero proportions belong on the landing page. On mobile, recompose navigation and artwork instead of simply stacking the desktop layout. Consolidate repeated unavailable tariff terms into one visible section notice.

Compose public screens with `PublicLayout`; it owns the header, main landmark, footer and shared `PageContainer`. Only `PageContainer` owns the outer maximum width and responsive gutters. Page content must not duplicate outer widths, breakpoint margins or horizontal page padding. Reuse shared brand and control components; keep page-specific composition inside the shell. Verify header, main content and footer alignment on landing and auth at identical viewport sizes, including widths around the desktop maximum.

Reserve a stable root scrollbar gutter so short and scrolling pages retain identical container geometry. Verify navigation between both at a tall viewport with classic scrollbars; overlay-scrollbar tests alone cannot catch this shift.

Use `PromotionalPanel` for the shared dark promotional surface on public pages. It owns padding, radius and colors; page styles own only internal layout. Compare the visible panel and text insets as well as the outer page container. Decorative borders must not introduce mismatched content offsets.

Use official full-color brand assets for named payment methods instead of generic banking or currency icons. Preserve original colors and proportions, store assets locally, and record their official source URLs.

Payment-method selection uses the whole available row as one keyboard-accessible target, with a directional indicator instead of a separate action button. Keep unavailable methods non-interactive and expanded form controls outside the row selection target.

Show failed financial requests in a visible, accessible alert with an explicit retry or sign-in action. Distinguish a backend unavailable response from an unknown outcome; do not describe a disabled service as an operation still being checked. Preserve the original request identity when retrying an unknown outcome.

Preserve control treatments the user has explicitly approved during subsequent layout or navigation changes. A layout redesign alone is not authorization to restyle existing controls; restore earlier treatments by reusing their original component. Address responsive usability within that treatment before replacing it with a different control placement or appearance.

Omit generic page titles that repeat the current location without adding context. Start with the first meaningful content heading and maintain a semantic heading hierarchy without enlarging it solely to make it the page heading.

Treat balance visibility as a shared presentation preference across account, reserved and card balances, including carousel and detail views. Keep payment-credential reveal separate from balance visibility.

In carousel and detail views, place the balance inside the card face; do not repeat the card name, balance or demo label below the artwork. In card detail views, lead with the card itself. Keep card actions and operation history below it rather than duplicating the balance in a separate panel.

In side-by-side option grids, align artwork, heading/selection, description and action rows across options. Accommodate wrapped titles and optional badges without shifting only one option’s description or button; let single-column layouts size naturally.

Use the same shared action-tile treatment for account and card-page actions, with the lime accent reserved for the primary top-up action. Preserve each action’s behavior and keyboard focus restoration when changing its presentation.

Adjacent card artwork and card-shaped action placeholders must share the same corner-radius token, including their focus outlines, so their silhouettes remain consistent.

Use a compact inline icon-and-label treatment for standalone account top-up controls; avoid stacked icon rows or secondary decorative arrows that add height. Keep the label on one line at mobile widths.

Keep card-detail actions in two columns: top-up and close share the first row, and information spans the second row at every viewport width. Center the action group below its card and share the same width constraint so their outer edges align.

Show announced but unavailable account actions beside the active action with an explicit coming-soon label and native disabled semantics. Keep disabled controls readable and suppress hover movement.

Present account and card actions as separate rounded buttons with visible spacing. Do not join them with a shared outer border, square inner corners or internal dividers. Keep keyboard focus outlines visible around each button.

Let the account action group fill the available content width with equal-width cells. Keep the separate card-detail group aligned to the card width.

Use the same compact 48px inline icon-and-label cells for card-detail and account action groups. Remove secondary corner arrows and keep labels on one line within the narrower card columns.

Deposit-address screens pair the copyable backend address with a real locally generated QR encoding that exact address. Keep a clear white quiet zone and verify decoding; omit redundant success headings once the address is visible.

Embed address-copy actions inside the read-only address field as a trailing icon control. Keep an accessible label, keyboard activation and visible copied feedback instead of a separate full-width copy button.

Finish the crypto-address flow with a compact lime «Я отправил» action that dismisses the modal and restores focus. User acknowledgement must not mark a payment confirmed or imply a balance credit; those states remain backend-owned.

Keep payment-row icons immediately left of the main description. Group payment history by calendar day, with amount and quieter time together on the right at mobile and desktop widths; preserve readable wrapping and tabular numerals without pushing time below the left-side text.

Place the payment-history heading and accessible icon-only refresh control above the transaction container. Render refresh as a bare icon with no border or background fill, including on hover; preserve its hit area and visible keyboard focus. The bordered surface holds transaction content and its empty/error states, not the section toolbar.

Place the account-balance heading above its surface using the same section-heading hierarchy as payment history; keep the amount and balance-visibility control inside the balance container. Center the visibility control vertically across the full balance surface, including wrapped secondary details, and reserve its own column to avoid overlap.

For crypto history, pair the circular token logo with a small overlapping network badge. Reuse the same token/network icon component in crypto payment creation modals, scaling both marks together. Use a compact operation title and secondary destination address when available; never label a destination as the sender. Reserve green plus-prefixed amounts for completed receipts and keep pending or failed statuses explicit.

For Telegram support controls, use the official full-color Telegram logo with its blue circle and white plane instead of a monochrome outline icon. Preserve the existing button treatment.

Make history rows keyboard-accessible entrypoints to a payment-detail card. Show server-provided fees and credited amounts separately; missing amounts are unavailable, never an implied zero. Keep full payment identifiers and destinations readable, and restore focus to the selected row when the card closes.

Give payment details an explicitly labeled, readable status badge. Place refresh beside close in the modal header instead of leaving it isolated below the receipt.

For one-time identity or onboarding collection, show status and a start action in the profile. Collect sensitive details in a modal; after submission, replace the action with submission status rather than keeping an editable profile form or redisplaying collected personal data.

Keep paired modal footer actions aligned with equal control heights and widths. Stack them at narrow widths when the longer label cannot fit comfortably in two columns.

When a gated view points to an existing nearby action, keep the explanation in the view and reuse that action. Avoid adding a second equivalent control inside the view unless it provides distinct behavior.
