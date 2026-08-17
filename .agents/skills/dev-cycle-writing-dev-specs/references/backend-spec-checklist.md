# Backend Spec Checklist

Fill section 3 of the dev spec from this checklist. Each item lists its rule type, default compliance degree, and the project default. Copy the rule into the spec, adjust only with a recorded Architecture Decision.

Implementation patterns for these defaults live in `backend-typescript-building-fastify-services` (and `backend/typescript/fastify.dev.md`). For Python projects, swap framework/library defaults for the `python-*` skills and `backend/python/fastapi.dev.md`; the checklist structure is unchanged.

## 1. Engineering Foundation

| Item | Type / Degree | Default |
|------|---------------|---------|
| 1.1 Language / runtime / package manager | Specification, must-have | TypeScript (strict mode), Node runtime, npm (npm workspaces for monorepos) |
| 1.2 Framework selection | Specification, must-have | Fastify. Hono only when edge/serverless deployment is a hard requirement (Architecture Decision) |
| 1.3 Build management | Specification, must-have | `tsc` for type-checking, `tsup` (or `tsc`) for build; scripts in `package.json`: `dev`, `build`, `start`, `check`, `test`, `lint` |
| 1.4 Storage systems | Specification, must-have | Postgres for every program (local via Docker Compose; `pgvector` for vector search); no secondary engines as systems of record |

## 2. Code Structure

| Item | Type / Degree | Default |
|------|---------------|---------|
| 2.1 Module layout | Specification, must-have | All source under `src/` (never at the backend root): `src/routes/`, `src/services/`, `src/repositories/`, `src/schemas/`, `src/jobs/`, `src/config/`, `src/lib/`; tests under `tests/`. Add `src/platform/ports/` and `src/adapters/` when replaceable external capabilities justify ports and adapters |
| 2.2 Naming conventions | Specification, must-have | `camelCase` functions/variables, `PascalCase` types/classes, `kebab-case` file names, `SCREAMING_SNAKE_CASE` env vars; route files named after the resource |
| 2.3 Layering rules | Specification, must-have | Default: routes (HTTP contract + validation) → services (business logic) → repositories (data access). For replaceable external systems: routes → services → capability ports, with repositories/provider clients as adapters. Routes never touch repositories or provider adapters directly |
| 2.4 Dependency direction rules | Specification, must-have | Dependencies point inward: services depend on repository/capability interfaces, not provider SDK implementations. No service imports a route; no repository or adapter imports a service |
| 2.5 API versioning policy | Specification, must-have | All public endpoints under `/api/v1/`; breaking changes require `/api/v2/`, never in-place |
| 2.6 Return types | Specification, must-have | Services and repositories return defined data structures (TypeBox/interface types), never untyped dictionaries or `any` |

## 3. Runtime Patterns

| Item | Type / Degree | Default |
|------|---------------|---------|
| 3.1 API contract strategy | Specification, must-have | Schema-first: every route declares TypeBox request/response schemas (`@fastify/type-provider-typebox`); OpenAPI generated via `@fastify/swagger`; frontend transport types/client generated from OpenAPI rather than handwritten |
| 3.2 Async / sync operations | Guidance, should-have | Prefer `async/await` throughout; never block the event loop with sync I/O in request handlers; offload CPU-heavy work to jobs |
| 3.3 Error / exception handling | Guidance, must-have | App error hierarchy extending a base `AppError` with code + HTTP status; one Fastify `setErrorHandler` maps errors to responses; never swallow an error without logging the stack |
| 3.4 Logging | Specification, must-have | pino (Fastify built-in logger); structured JSON in production, pretty in dev; every request log carries `request_id`; no `console.log` |
| 3.5 Config / env | Specification, must-have | `env-schema` with a TypeBox schema in `src/config/`; fail fast at startup on missing/invalid vars; `.env.example` kept current. Secret fields have no working defaults in shared code; explicit local/test profiles or fixtures inject non-production values |
| 3.6 Background jobs / scheduler | Specification, must-have | Select from delivery requirements: an in-process scheduler only for disposable/idempotent maintenance work; a durable queue (for example pg-boss on Postgres) for business-critical work that must survive restarts. All jobs require logging, retry/backoff, idempotency, dependencies, status, and enable/pause controls |
| 3.7 Observability | Specification, should-have | `/health` and `/ready` endpoints always; OpenTelemetry traces/metrics for service deployments |

## 4. Data Policies

| Item | Type / Degree | Default |
|------|---------------|---------|
| 4.1 Database access pattern | Specification, must-have | Repository layer only. Drizzle ORM on Postgres. No SQL outside `src/repositories/` |
| 4.2 Transaction rules | Specification, must-have | Multi-write operations run in a transaction owned by the service layer; repositories accept an optional transaction handle; no nested transactions |
| 4.3 Migration policy | Specification, must-have | drizzle-kit migrations; forward-only and committed with the change that needs them |
| 4.4 Input / output validation policy | Specification, must-have | Validate at the boundary: TypeBox schemas on every route for body/query/params and response; internal layers trust validated types |
| 4.5 Retention and deletion | Specification, must-have | Choose soft delete, archival, or hard delete per entity based on recovery, retention, privacy, and erasure requirements; document purge behavior |
| 4.6 ID / time / pagination conventions | Specification + Guidance, should-have | IDs: UUIDv7 (Specification). Time: store UTC, ISO-8601 in APIs (Specification). Pagination: cursor-based for feeds, limit/offset acceptable for small admin lists (Guidance) |

## 5. Security Policies

| Item | Type / Degree | Default |
|------|---------------|---------|
| 5.1 Authentication | Specification, must-have | Select per client using `docs/security/authentication.md`; document identity provider, flow, transport, expiration, rotation, revocation, recovery, reauthentication, MFA, CSRF, abuse controls, audit, and tests |
| 5.2 Authorization | Specification, must-have | Deny by default; backend enforcement on every access path; include a scoped permission/role matrix, ownership/relationship rules, tenant isolation, repository constraints, audit, and negative tests using `docs/security/authorization.md` |
| 5.3 Secrets | Specification, must-have | Secrets only via env (never committed, never logged); `.env` gitignored; `.env.example` may carry safe non-secret defaults, while secret keys have empty values plus provisioning notes |
| 5.4 CORS | Specification, must-have | `@fastify/cors` with an explicit origin allowlist; no `*` in production |
| 5.5 Rate limits | Specification + Guidance, should-have | `@fastify/rate-limit` on public endpoints (Specification); tune per-route limits by cost (Guidance) |
| 5.6 Dependency scanning | Specification, should-have | `npm audit` in CI; automated update PRs (Dependabot/Renovate) for security patches |
| 5.7 Audit logging | Specification + Guidance, should-have | Log auth events and destructive operations with actor + target (Specification); extend to all writes for sensitive domains (Guidance) |
| 5.8 Threat model | Specification, should-have | Required for external users, sensitive data, federated identity, or multi-tenant systems; use `templates/threat-model.md` |
| 5.9 Inbound webhooks | Specification, must-have when applicable | Verify signatures over the exact preserved raw body before trusting parsed fields; use provider verifier or constant-time digest comparison, reject stale signed timestamps where supported, and deduplicate durably on provider event/message id |

## 6. DevOps Policies

| Item | Type / Degree | Default |
|------|---------------|---------|
| 6.1 Deployment / runtime model | Specification, must-have | Long-running Node process in a container (see `system-developing-with-docker`); local single-user apps run as a plain process |
| 6.2 Environment strategy | Specification, must-have | `development` / `production` minimum (`staging` for service programs); behavior switches only via validated config, never `NODE_ENV` string checks scattered in code |
| 6.3 CI checks | Specification, must-have | Every PR runs type-check, lint, relevant Vitest suites, generated-contract drift check, dependency/security checks, and critical Playwright smoke tests for browser apps; merge blocked on failure |
| 6.4 Release process | Specification, should-have | Tagged releases from `main`; conventional commits (see `general-writing-commit-messages`) drive the changelog |
| 6.5 Rollback process | Specification, should-have | Previous container image redeployable at any time; forward-only migrations must be backward-compatible for one release |
| 6.6 Runtime monitoring and alerting | Guidance, nice-to-have | Alert on error rate and `/health` failures for service deployments |
| 6.7 Documentation requirements | Guidance, should-have | `README` covers run/test/deploy; the dev spec's Progress Log and Change Log are kept current (see template Maintenance Rules) |
| 6.8 Production adapter readiness | Specification, must-have | Declare the production adapter for every stateful or external port. Production uses durable, non-stub adapters for required state/side effects; no in-memory adapter is selected where restart would lose product state |
