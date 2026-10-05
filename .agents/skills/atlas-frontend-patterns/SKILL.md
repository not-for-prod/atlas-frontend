---
name: atlas-frontend-patterns
description: Build or refactor Atlas React and Next.js screens, components, and frontend tests while preserving layer and ownership boundaries.
---

# Atlas frontend patterns

Use `app`, `views`, `widgets`, `features`, `entities`, `shared` in descending dependency order. Keep Next pages as delegates; views compose screens, features implement user actions, entities expose domain data. Import another slice through its root `index.ts`; use relative imports inside a slice.

Build every page as an atomic-design component tree: primitives and controls → composed components → page sections → layout/template → page. Apply this composition within the existing layer structure; do not introduce parallel `atoms`/`molecules` folders or bypass dependency boundaries.

Before creating a component, inspect existing shared UI, themed Mantine controls, entity components, widgets and layouts for the same responsibility. Reuse first; use composition or a small semantic variant when an existing component needs to support another context. Create a new component only for a distinct responsibility that existing components cannot express cleanly. Do not copy a component or its styles into a page merely to change content, spacing or appearance, and do not add pass-through wrappers with no ownership.

Pages assemble the component tree and supply data and content. Repeated structure and visual rules belong to their reusable owner, including container geometry, surfaces, typography and controls. When duplication appears, consolidate it and migrate affected consumers in the same change. Account payment history and card-operation history must reuse the history component, including unavailable states. Reuse presentation without substituting account-wide data for a missing card-scoped API. Keep truly page-specific composition local; avoid growing shared components with unrelated page-name flags. Review changes for reuse and verify affected consumers whenever shared behavior or styling changes.

Keep a slice's public root component at the root. Put private children under `components/<Child>/<Child>.tsx` with a local `index.ts`; children used by only one component belong beneath that parent. Do not export private grandchildren to higher layers. One component per TSX file; meaningful JSX blocks are components, not render helpers.

Hooks belong in `lib/hooks/<hook>.ts`; pure utilities in `lib/utils/<function>.ts`. Use intentional `lib/index.ts`, `model/index.ts` and root exports. Model files contain types or client state, not React components or query hooks. Avoid catch-all hooks/utils files.

Use Mantine for layout and controls, CSS Modules for custom geometry, dictionaries for copy. Use inline type specifiers, e.g. `import { type Card } from '~/entities/card'`. Keep API orchestration, query invalidation and business transformations out of components. React Query owns server state; local interaction state stays local.

Name tests after the behavior's owning component/hook/helper with `.spec.ts(x)`. View tests exercise public props or mock entity APIs, never generated clients. Verify user-visible states and interactions rather than implementation details. Run `bun lint`, `bun run test:run`, and `bun run build` after foundation changes.

See `../../../docs/architecture.md` for the development-only preview boundary and `../../../docs/reuse-manifest.md` for source provenance.
