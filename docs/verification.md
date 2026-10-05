# Foundation verification

Date: 2026-09-25. Scope: approved foundation, component gallery and dashboard preview. No live Atlas authentication or payment integration is claimed.

## Completed checks

- Fresh `bun install`, followed by `bun install --frozen-lockfile`: dependencies resolved and locked; frozen install made no changes.
- `bun lint`: ESLint, TypeScript, Stylelint and Prettier.
- `bun run test:run`: 45 passing tests across 10 files, covering selected inherited lint rules, exact cents formatting, generic transport, balance disclosure, preview dialog and error/retry behavior.
- `bun skills:validate`: three adapted skills and their relative documentation references.
- `bun run build`: successful optimized Next production build.
- `PLAYWRIGHT_CHANNEL=chrome bun run test:e2e`: three development browser tests passed, one production-only test skipped. Tested 375px and 1440px, no horizontal overflow, modal keyboard activation/Escape/focus return, all five dashboard scenarios, no page exceptions and no business API calls.
- Production isolation is separately checked by `PLAYWRIGHT_CHANNEL=chrome bun run test:production`: both preview URLs must return 404; the home page must render the launch placeholder; emitted client chunks must omit fixture markers.

Screenshots are in ignored `artifacts/screenshots`: dashboard/gallery at 375px and 1440px, plus the AtlasPay card reference. Renderings were inspected. AtlasPay was served as static web assets only; its Node business server and credentials were not used.

## Corrections discovered during verification

- The extracted transport needed root-relative paths after removing the reference API prefix.
- Mantine unit tests need its test environment; real browser tests separately cover portals, animation and focus restoration.
- A `notFound()` guard alone did not prevent Next RSC discovery from bundling preview clients. Production module replacement excludes preview entrypoints as well as retaining route guards.
- Muted Mantine text uses Atlas's darker readable token; the graphite card's label now matches the reference premium variant.
- Generated `next-env.d.ts` is excluded from formatting so a build cannot dirty the formatting gate.

## Remaining scope

Email login, session persistence/logout/expiry, OAuth handoff, `/client` integration, cards, money workflows, admin and Telegram are not implemented. API generation requires an agreed external schema snapshot; no invented client was generated. See [API gaps](api-gaps.md).

The new UI directory is not yet initialized as a Git repository and has no remote or commits. The backend working tree was left intact apart from the migration-plan status update.
