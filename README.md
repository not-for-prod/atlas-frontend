# Atlas UI

The first frontend foundation for Atlas: Next.js, React, TypeScript, Mantine, React Query, Ky and an Orval generation entrypoint. Engineering patterns come from the Polymarket frontend; visuals come from AtlasPay; business contracts belong to Atlas.

```sh
bun install --frozen-lockfile
bun dev --port 3001
```

Open http://localhost:3001 for the migrated public landing page. `/account` provides policy-driven sign-in and sign-up, retaining an optional selected tariff in the URL. Configure the backend URL and cookies using [authentication setup](docs/authentication.md). In development, open `/preview` and use the scenario picker to inspect data, new account, loading, provisioning and error states. `/preview/gallery` contains design primitives and confirmation-dialog examples. Preview values are fictional. Landing and preview pages require no backend; authorization requires a configured Atlas service.

Production serves the public landing and authorization page; both preview routes return 404. Email and OAuth flows use the Atlas service through direct credentialed browser requests. Card operations and payments remain unconnected. See [API gaps](docs/api-gaps.md).

```sh
bun lint
bun run test:run
bun skills:validate
bun run build
bun start --port 3001
```

Use the installed Bun version recorded in `packageManager`; `bun.lock` fixes dependency resolution. `ATLAS_OPENAPI_FILE=contracts/authorization.swagger.json bun codegen` regenerates the pinned authorization contract. Generated output is reproducible and must be reviewed with its schema change.

Read [architecture](docs/architecture.md), [reuse manifest](docs/reuse-manifest.md), and [verification](docs/verification.md). `AGENTS.md` and `.agents/skills` hold the project-specific engineering instructions.

Browser checks: `bun x playwright install chromium`, then `bun run test:e2e`. For production browser tests, use the fixture build settings in [authentication verification](docs/authentication.md#verification). To use an installed Chrome instead, set `PLAYWRIGHT_CHANNEL=chrome`. Browser checks capture mobile/desktop screenshots under ignored `artifacts/screenshots`.

See [landing migration](docs/landing-migration.md) for source mapping, API-dependent copy changes and browser verification.
