# Atlas UI

Read `docs/architecture.md` and `docs/api-gaps.md` before changing behavior.

## Sources and authority

- `../atlas` owns backend behavior, API contracts and the money model.
- `../AtlasPay` is the design and candidate-feature reference, not API truth.
- `/Users/tsaralovnikita/GolandProjects/bitbucket/service-polymarket-frontend` is the engineering reference. See `docs/reuse-manifest.md` for extraction provenance.
- Explicit user decisions override inherited reference conventions. Do not copy obsolete account merging, instant issuance or provider capability promises.

## Local skills

Canonical skills live only in `.agents/skills`:

- `atlas-frontend-patterns`: React/Next layer ownership, components and tests.
- `atlas-api-boundaries`: entity wrappers, generated contracts and monetary data.
- `atlas-ui-design`: tokens, screen composition, copy and states.
  Read the matching skill before work. These are adapted rules, not an instruction to apply every source skill.

## Boundaries

`app → views → widgets → features → entities → shared`. Route files are thin delegates. Public cross-slice imports use `index.ts`; slice internals use relative paths. Generated business code is accessed through entity `lib`/`model` or shared transport only. Never edit generated code manually.

`src/preview` is development composition, not a business layer. Only development-gated route entrypoints load it. Production preview URLs must return 404. Never substitute fixtures after live request failures. Display money-operation success only after backend confirmation.

Use React Query for server state, component state for local interactions. Add Effector only when shared client workflow needs it. No duplicated server-state stores.

## Component composition

All pages must follow atomic-design component composition and reuse existing components before adding new ones. Follow the reuse and extraction rules in [atlas-frontend-patterns](.agents/skills/atlas-frontend-patterns/SKILL.md) within the existing layer boundaries.

## Verification

Use Bun and retain `bun.lock`:

- `bun dev` — public landing page plus development dashboard and component gallery.
- `bun lint` — ESLint, TypeScript, Stylelint and formatting.
- `bun run test:run` — behavior and retained architecture rule tests.
- `bun skills:validate` — local skill frontmatter/references.
- `bun run build` then `bun start` — production build; `/preview` and `/preview/gallery` return 404.
- `ATLAS_OPENAPI_FILE=<agreed-local-snapshot> bun codegen` — only after an API contract is agreed.

Run focused verification while iterating, all checks after shared changes. For UI changes inspect 375px and desktop renderings, keyboard focus and dialogs. Do not call preview data a live integration.

Before implementing a live operation, establish request/response, auth, permissions, error format, states, exact monetary encoding, retry/idempotency, polling and examples. New backend behavior follows the backend's existing approval workflow. Tooling and visual work do not introduce backend aggregates.
