# Hello Task — Engineering Dev Spec

- PRD: [docs/prd/hello-task.md](prd/hello-task.md)
- Architecture narrative: [../design/architecture.md](../design/architecture.md)
- Status: in-implementation
- Last updated: 2026-08-17

## 1. System Overview

Hello Task is a single Fastify (TypeScript, Node 24) HTTP service with two
routes: `GET /health` for deploy health checks, and `GET /` which returns a
server-rendered HTML page containing the text "Hello, Venture!". There is no
frontend build, no client-side JavaScript, no database, and no external
integration — the entire system is one process. This spec exists to exercise
the Foreman delivery path cheaply (PRD §Problem); the product itself is
deliberately minimal.

## 2. Architecture Decisions

### Decision: No frontend framework, no Postgres, no auth

- Context: The stack defaults (`dev-cycle-writing-dev-specs` skill) assume
  React on the frontend and Postgres for storage. PRD §Requirements states
  "No frontend framework needed — served HTML is enough," and PRD §Non-Goals
  excludes "Any database or persistence of any kind" and "Accounts, sign-in,
  or user identity."
- Options considered: (a) follow the defaults regardless, (b) deviate per the
  PRD's explicit non-goals.
- Chosen: (b) — Fastify serves the HTML string directly from the route
  handler; no database, ORM, or migration tooling is included; no
  authentication or authorization layer exists.
- Consequences: Sections 4 (Data Policies), 5.1–5.2 (Authentication /
  Authorization), and 4 (Frontend Spec) of the template are deleted below —
  see the Change Log. Any future requirement for stored data, accounts, or a
  richer UI requires a PRD change first (PRD §Non-Goals), then a spec update.

## 3. Backend Spec

### 3.1 Engineering Foundation

- 3.1.1 [Specification, must-have] TypeScript (strict mode via `tsconfig.json`),
  Node 24 runtime (`.nvmrc`, `package.json#engines`), npm as package manager
  (`packageManager: npm@11.6.2`).
- 3.1.2 [Specification, must-have] Fastify, per stack default. No Hono
  deviation — no edge/serverless requirement exists.
- 3.1.3 [Specification, must-have] `tsx` runs `src/app/src/server.ts`
  directly in dev (`npm run dev`); `tsc --noEmit` type-checks; `vitest run`
  is the test runner (`npm test`). No separate build step ships — the
  container's runtime `CMD` also uses `tsx` (no bundling needed for one file).
- 3.1.4 [Specification, must-have] **No storage system.** Deviates from the
  Postgres default — PRD §Data and roles: "Records stored: none." See
  Architecture Decision above.

### 3.2 Code Structure

- 3.2.1 [Specification, must-have] All source under `src/app/src/`; the one
  file, `server.ts`, exports `buildServer()` (used by tests via Fastify
  `.inject()`) and self-starts when run directly. No `routes/`,
  `services/`, `repositories/` split — two routes with no business logic or
  persistence do not justify the layering the checklist otherwise requires;
  this is a documented deviation from checklist item 2.1/2.3, justified by
  PRD scope.
- 3.2.2 [Specification, must-have] `camelCase` functions, `kebab-case` file
  names — followed as-is (`server.ts`, `buildServer`).
- 3.2.3 [Specification, must-have] `/api/v1/` versioning does not apply:
  `GET /` and `GET /health` are not a versioned API — they are the whole
  product's public surface, matching PRD §Requirements ("No other public
  routes").
- 3.2.4 [Specification, must-have] Route handlers return typed values
  (TypeBox schema for `/health`; a plain string for `/`, see 6 API Contract).

### 3.3 Runtime Patterns

- 3.3.1 [Specification, must-have] Schema-first for `/health`
  (`@fastify/type-provider-typebox`, TypeBox response schema). `/` returns
  `text/html` and is documented in section 6 rather than schema-validated,
  since Fastify's TypeBox provider validates JSON-shaped responses, not HTML
  bodies; the route's contract is instead enforced by the test in
  `tests/unit/root.test.ts` (status code + exact substring).
- 3.3.2 [Guidance, should-have] `async/await` throughout — both handlers are
  `async` even though neither awaits I/O, for consistency with future routes.
- 3.3.3 [Guidance, must-have] Errors are not swallowed: Fastify's default
  error handler returns structured JSON errors (as already observed for
  unmatched routes — `404 {"message":"Route GET:/ not found", ...}`); the
  `.listen()` startup failure path logs via `app.log.error(error)` and exits
  1 (`src/app/src/server.ts`). No custom `AppError` hierarchy is added —
  two routes with no domain logic produce no application errors to model.
- 3.3.4 [Specification, must-have] pino via `Fastify({ logger: true })`;
  structured JSON request/response logs; no `console.log` in `src/`.
- 3.3.5 [Specification, must-have] Config: `PORT`, `HOST` (and pino's
  built-in `LOG_LEVEL` env support) are the only environment inputs, read
  directly via `process.env` with defaults (`3000`, `127.0.0.1`) in
  `server.ts`; declared in `.env.example`. No `env-schema`/TypeBox config
  module: three optional, non-secret values with safe defaults do not
  justify a validation layer the PRD's "no runtime secrets" scope doesn't
  need — documented deviation from checklist item 3.5.
- 3.3.6 [N/A] Background jobs/scheduler — PRD §Non-Goals: "Real-time
  features, background jobs, email, or scheduled work."
- 3.3.7 [Specification, must-have] `/health` always available; no `/ready`
  (nothing to warm up — no DB pool, no cache). No OpenTelemetry — single
  process, no distributed trace to correlate (see `ops.telemetry-flowing`,
  step 13, out of dev-cycle scope).

### 3.4 Data Policies

N/A in full — PRD §Data and roles: "Records stored: none. No database, no
session, no cookie, no user-generated content." No repository layer,
transactions, migrations, or retention policy exist because there is nothing
to store. (Deleted per template instruction; see Change Log.)

### 3.5 Security Policies

- 5.3 [Specification, must-have] Secrets: none exist (PRD §Technical Notes:
  "No database, no external API, no runtime secrets"). `.env.example`
  declares only non-secret runtime config (`PORT`, `HOST`, `LOG_LEVEL`);
  `.env` is gitignored.
- 5.4 [N/A] CORS — no cross-origin API consumer; the two routes are served
  and consumed the same way a static site would be (direct browser
  navigation).
- 5.6 [Specification, should-have] `npm audit` — run as part of step 07/08
  evidence; no Dependabot/Renovate config added (out of dev-cycle scope; the
  PRD names no ongoing maintenance obligation).
- 5.1 Authentication, 5.2 Authorization, 5.5 Rate limits, 5.7 Audit logging,
  5.8 Threat model: N/A — PRD §Data and roles: "No authentication, no
  authorization tiers"; §Non-Goals: "Accounts, sign-in, or user identity";
  single anonymous-visitor role with no distinguishable actions to rate-limit
  or audit; no external users beyond the one anonymous role, no sensitive
  data, no multi-tenancy — threat-model criteria are not met.
- 5.9 [N/A] Inbound webhooks — none exist.

### 3.6 DevOps Policies

- 6.1 [Specification, must-have] Long-running Node process in a container
  (`deploy/local/docker-compose.yml` for local rehearsal;
  `hello-task.pengfeng.leettools.ai` via `leet-deploy` for production — see
  `design/architecture.md` Deployment Topology).
- 6.2 [Specification, must-have] `local` and `production` environments only
  (`.agents/environments.json`); no `staging` — declared production-only by
  venture decision (see step 11 checklist `deploy.prerelease-rehearsal`).
  Behavior never branches on `NODE_ENV`; the two routes behave identically
  everywhere.
- 6.3 [Specification, must-have] CI (`.github/workflows/ci.yml`) runs
  `npm ci`, `npm run check:scaffold`, `npm run check:checklist`, `npm test`
  on every push/PR. No separate lint step exists yet (no `lint` script in
  `package.json`); `tsc --noEmit` stands in as the static-check gate — see
  Change Log if a linter is added later. No Playwright smoke test runs in CI
  (the e2e coverage in `tests/e2e/` uses Fastify `.inject()` against the real
  app, not a browser, since there is no client-side behavior to browser-test
  — see `design/architecture.md`).
- 6.4 [Guidance, should-have] Conventional commits; release tagging is out of
  dev-cycle scope (work-dev-cycle.md Step 10 exclusion).
- 6.5 [Guidance, should-have] Rollback: redeploy the previous container image
  — see `deploy/production/README.md` and step 11 checklist
  `deploy.rollback-confirmed`.
- 6.6 [N/A for dev-cycle] Alerting — step 13, explicitly out of dev-cycle
  scope.
- 6.7 [Guidance, should-have] `README.md` documents run/test/deploy; this
  spec's Progress Log/Change Log are kept current through implementation.
- 6.8 [N/A] No stateful or external port exists to declare a production
  adapter for.

## 4. Frontend Spec

N/A in full — PRD §Requirements: "No frontend framework needed — served HTML
is enough." `GET /` returns a static HTML string from the Fastify handler;
there is no client bundle, no component tree, and no client-side state.
(Deleted per template instruction; see Change Log.)

## 5. Identity and Access

N/A in full — single anonymous-visitor role, no authentication, no
authorization tiers, no tenancy (PRD §Data and roles). (Deleted per template
instruction; see Change Log.)

## 6. API Contract

Two routes total; no other public routes (PRD §Requirements).

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| GET | `/health` | none | `200` `{ "status": "ok" }` (`application/json`), TypeBox schema `Type.Object({ status: Type.Literal("ok") })` | Already implemented (`src/app/src/server.ts`) |
| GET | `/` | none | `200` HTML (`text/html`) containing the literal text "Hello, Venture!" | Server-rendered, no template engine needed for one static string |
| * | any other path | — | `404` `{ "message": "Route <METHOD>:<path> not found", "error": "Not Found", "statusCode": 404 }` | Fastify's default not-found handler; matches PRD "No other public routes" |

No versioning (`/api/v1/` does not apply — see 3.2.3). No OpenAPI generation:
two static routes with no client consumer beyond a browser do not justify a
generated-client pipeline (documented deviation from `general-designing-apis`
default).

## 7. Data Model

None. No entities, no persistence, no migrations (PRD §Data and roles:
"Records stored: none").

## 8. Test Strategy

| Criterion / risk | Test level | File or command | Expected evidence |
|---|---|---|---|
| AC1: `npm test` passes and `npm run dev` serves locally | Unit + manual/smoke | `npm test`; `npm run dev` + `curl` | `npm test` exits 0; `curl` against the running dev server returns 200 from both routes |
| AC2: `GET /health` → 200 `{status:"ok"}` | Unit (Fastify `.inject()`) | `tests/unit/health.test.ts` | Passing assertion on status code and body |
| AC3: `GET /` → 200 HTML containing "Hello, Venture!" | Unit (Fastify `.inject()`) | `tests/unit/root.test.ts` | Passing assertion on status code, content-type, and body substring |
| Primary flow "Look" (PRD §Primary flow) | E2E (real HTTP request/response cycle, not handler-in-isolation) | `tests/e2e/look.e2e.test.ts` | A test that starts the real server and issues an HTTP request against its listening socket, asserting "Hello, Venture!" is present |
| Primary flow latency bound ("within one second") | Performance assertion | `tests/e2e/look.e2e.test.ts` | Measured response time asserted `< 1000ms` |
| Unmatched route returns 404, not a crash | Unit | `tests/unit/not-found.test.ts` | 404 with Fastify's default error shape |
| Regression guard | N/A | — | New build, no defect fixed (PRD names none) |

No test data, identity, or tenancy fixtures are needed (no persistence, no
auth). No parallel-execution hazards: each test builds its own isolated
Fastify instance via `buildServer()` and closes it in a `finally` block; the
e2e test binds an ephemeral port (`port: 0`) so it cannot collide with other
suites or a developer's running `npm run dev`. CI runs the full suite
(`npm test`) as one tier — the suite is small enough that further tiering
(unit vs. integration split) would add process, not coverage.

## Progress Log

- 2026-08-17 — Dev spec and architecture written against the existing
  `GET /health` implementation; `GET /` not yet built. Next: implementation
  plan (`docs/plans/hello-task.md`), then the `GET /` route and its tests.

## Change Log

- 2026-08-17 — Initial spec. Deleted template sections 4 (Frontend Spec) and
  5 (Identity and Access) in full, and most of section 3.4 (Data Policies),
  per the PRD's explicit non-goals (no frontend framework, no auth, no
  persistence) — see Architecture Decision "No frontend framework, no
  Postgres, no auth."
