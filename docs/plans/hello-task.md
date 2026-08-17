# Plan: Hello Task — `GET /` greeting route

- PRD: [../prd/hello-task.md](../prd/hello-task.md)
- Dev spec: [../dev-spec.md](../dev-spec.md)

## 1. Affected Files

- `src/app/src/server.ts` (modify) — add `GET /` returning HTML; wire
  `LOG_LEVEL` into the Fastify logger to match the config declared in
  `.env.example` (currently declared but unread).
- `tests/unit/root.test.ts` (create) — unit test for `GET /` via Fastify
  `.inject()`, following the existing pattern in `tests/unit/health.test.ts`.
- `tests/unit/not-found.test.ts` (create) — unit test for the 404 fallback on
  an unmatched route.
- `tests/e2e/look.e2e.test.ts` (create) — end-to-end test that starts the
  real server on an ephemeral port and issues a real HTTP request against
  `/`, covering PRD §Primary flow "Look" and its <1s latency bound.
- `tests/e2e/README.md` (modify or delete) — currently a placeholder; replace
  with a short description once the e2e test exists, or delete if the test
  file itself is self-explanatory.
- `docs/dev-spec.md` (modify) — Progress Log entry once built.

## 2. Architecture Decisions

No new decisions beyond `docs/dev-spec.md` §2 ("No frontend framework, no
Postgres, no auth") — this plan implements exactly what that spec already
commits to.

## 3. Test Plan

| Criterion / risk | Test level | File or command | Expected evidence |
|---|---|---|---|
| AC1: `npm test` passes and `npm run dev` serves locally | Unit + manual | `npm test`; `npm run dev` + `curl http://127.0.0.1:3000/{,health}` | `npm test` exits 0; both curls return 200 |
| AC2: `GET /health` → 200 `{status:"ok"}` | Unit | `npm test -- tests/unit/health.test.ts` | Already passing; must stay green |
| AC3: `GET /` → 200 HTML containing "Hello, Venture!" | Unit | `npm test -- tests/unit/root.test.ts` | New test, written first, fails (route missing), then passes after task 1 |
| Unmatched route → 404, not a crash | Unit | `npm test -- tests/unit/not-found.test.ts` | New test asserting Fastify's default 404 shape |
| Primary flow "Look" — real HTTP request/response, not handler-in-isolation | E2E | `npm test -- tests/e2e/look.e2e.test.ts` | Server started on `port: 0`, real `fetch()` against `http://127.0.0.1:<port>/`, body contains "Hello, Venture!" |
| Primary flow latency bound ("within one second") | Performance assertion, same e2e test | same file | Measured response time `< 1000` ms, asserted in the test |

Test data/fixtures: none needed (no persistence, no auth, no fixtures).
Isolation: every test builds its own `buildServer()` instance and closes it
in `finally`; the e2e test binds `port: 0` (OS-assigned) so it never
collides with a developer's `npm run dev` or with other test files running
in parallel under Vitest's default pool.

## 4. Tasks

### Task 1: Write the failing tests first
- Files: `tests/unit/root.test.ts` (create), `tests/unit/not-found.test.ts`
  (create), `tests/e2e/look.e2e.test.ts` (create)
- Verify: `npm test` — the two new unit tests and the e2e test fail (no `/`
  route exists yet); `tests/unit/health.test.ts` still passes. Capture this
  failing run as essential-test-first evidence before Task 2.

### Task 2: Implement `GET /` and wire `LOG_LEVEL`
- Files: `src/app/src/server.ts` (modify)
- Verify: `npm test` — all four test files pass (0 failures); `npm run dev`
  then `curl -i http://127.0.0.1:3000/` returns `200` HTML containing
  "Hello, Venture!"

### Task 3: Clean up the e2e placeholder and finalize dev-spec Progress Log
- Files: `tests/e2e/README.md` (delete — superseded by the real test file),
  `docs/dev-spec.md` (modify — Progress Log entry)
- Verify: `npm run check:scaffold` still exits 0 (e2e directory still exists
  and is non-empty because of `look.e2e.test.ts`)

## Risks and Rollback

The plan includes a production deploy (step 11, `hello-task.pengfeng.leettools.ai`
via `leet-deploy`) but no migration and no auth change (PRD has neither), so
`plan.risks-and-rollback`'s scope narrows to the deploy itself: rollback is
redeploying the previous container image (see `deploy/production/README.md`,
written at step 11). No data migration exists to roll back.

## Slices

Each task above is independently reviewable and lands as its own commit:
tests-first (Task 1, expected to fail), then the minimal implementation that
turns them green (Task 2), then cleanup (Task 3).
