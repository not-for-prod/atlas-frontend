---
name: atlas-api-boundaries
description: Add or change Atlas frontend API generation, entity adapters, server-state queries, or monetary display without inventing backend support.
---

# Atlas API boundaries

Atlas's actual approved API is authoritative. Generate `src/generated/atlas` from an agreed schema; never synthesize a production contract from AtlasPay screens or manually edit generated output. `bun codegen` requires an explicit schema snapshot.

Generated clients and models belong behind entity `lib`/`model` public APIs, with shared transport as an exception. Features orchestrate entity APIs; views/components never import generated modules. Re-export generated model types with short names. Add mapping only for real formatting, aggregation or contract adaptation, not field-for-field duplicate types.

Use individual hook files under `lib/hooks`; not `lib/hooks.ts`. Simple generated hooks may be re-exported; use manual hooks for mutation/invalidation, auth, polling or combined calls. Query invalidation belongs in hooks.

Authorization uses direct credentialed browser requests and backend-owned HttpOnly session cookies described in `../../../docs/authentication.md`. Match an explicitly requested reference transport model at the browser network boundary; do not introduce a server proxy without an explicit product decision. Never move bearer storage into browser JavaScript. No session refresh or backend revocation endpoint exists. Read `../../../docs/api-gaps.md` before adding live operations. Preserve cookie association and Origin behavior; do not copy reference-product auth or put tokens in redirect URLs. Handle JSON and text errors according to real endpoints. Interpret failures in the context of the operation: a 404 while creating a resource must not be presented as expiration of an existing resource.

Preserve documented, actionable authentication error codes through OAuth redirects. Offer explicit registration for a verified identity with no account; never infer that condition from every 404 or create an account automatically.

Keep available, reserved and card balances separate. Preserve the API's exact monetary encoding and denomination; use decimal arithmetic for decimal monetary contracts and never convert financial values through JavaScript Number. Formatting is not financial arithmetic. A timeout is an unknown outcome, not proof that a money command failed. Follow backend idempotency and recovery contracts; never automatically retry money mutations by default.

Preview fixtures are presentation data only. They must never act as a fallback for failed live requests or be presented as implemented APIs. Mark each feature's readiness explicitly.

Protect account screens with a shared session gate before mounting private queries. Authentication rejection by any account request must hide the whole private view, close its details, cancel pending reads and discard private query caches; independent widget error states must not leave another widget showing account data. When a protected account route has no valid session, replace the route with the login page after clearing private data; do not leave an inline sign-in prompt inside the cabinet. Keep transient session-check failures retryable rather than treating them as signed out. Cover redirects and session expiry with previously loaded data in regression tests.
