# Checklist — Step 07: Prove it works

Gate (from lifecycle): Full suite green on the branch; each acceptance
criterion has passing evidence; no criterion verified by assertion alone.

## test.suite-green — Full suite passes on the branch  [must]

- Invariant: The complete test suite runs and passes on the feature branch, not
  just a subset the author picked.
- Evidence required: Full-suite run output, or the CI run for the branch.
- Counterexample: Tests pass locally with one file skipped that fails in CI.
- Applies when: Always.
- Status: MET — `npm test` (`vitest run`, no filters, all 4 files):
  "Test Files 4 passed (4)" / "Tests 4 passed (4)". Held open for hosted-CI
  confirmation at step 09 (`pr.ci-green`) once pushed.

## test.criteria-proven.ac1-npm-test-dev — AC1: `npm test` passes and `npm run dev` serves locally  [must]

- Invariant: `npm test` exits 0 and `npm run dev` starts the server and serves
  requests locally, exercised by an automated check, not a claim.
- Evidence required: Named test/command output for both halves of the
  criterion.
- Counterexample: `npm test` is green but `npm run dev` was never actually run.
- Applies when: Always. Expand per acceptance criterion (this is
  `test.criteria-proven` expanded for PRD §Acceptance Criteria item 1).
- Status: MET — see `scaffold.baseline.green` (step 00): `npm test` exits 0
  (4/4); `npm run dev` bound `127.0.0.1:3000` and served both routes,
  confirmed with `curl`.

## test.criteria-proven.ac2-health — AC2: `GET /health` returns 200 `{status:"ok"}`  [must]

- Invariant: A named test issues `GET /health` and asserts status 200 and body
  `{ "status": "ok" }`.
- Evidence required: The passing test name (e.g. `tests/unit/health.test.ts`)
  and its output.
- Counterexample: The criterion is "verified" by manual inspection only.
- Applies when: Always. Expand per acceptance criterion (this is
  `test.criteria-proven` expanded for PRD §Acceptance Criteria item 2).
- Status: MET — `tests/unit/health.test.ts` asserts `statusCode === 200` and
  `body === { status: "ok" }`; passing in the 4/4 `npm test` run.
- Note: `tests/unit/health.test.ts` already covers this criterion; needs to
  stay green as the build proceeds.

## test.criteria-proven.ac3-root-greeting — AC3: `GET /` returns 200 HTML containing "Hello, Venture!"  [must]

- Invariant: A named test issues `GET /` and asserts status 200 and that the
  HTML body contains the text "Hello, Venture!".
- Evidence required: The passing test name and its output.
- Counterexample: The criterion is "verified" by a test that only checks the
  status code, not the greeting text.
- Applies when: Always. Expand per acceptance criterion (this is
  `test.criteria-proven` expanded for PRD §Acceptance Criteria item 3).
- Status: MET — `tests/unit/root.test.ts` asserts `statusCode === 200`,
  `content-type` contains `text/html`, and `body` contains "Hello, Venture!";
  passing in the 4/4 `npm test` run.
- Note: No `/` route exists yet in `src/app/src/server.ts` — this criterion
  has no implementation or test yet. (Resolved: route implemented, see
  commit "feat: implement GET / greeting route (AC3)".)

## test.critical-flows-e2e.look — Critical flow "Look" has end-to-end coverage  [must]

- Invariant: An automated test drives the real HTTP surface — visiting `/` and
  reading the rendered response — matching PRD §Primary flow step 1 ("Look").
- Evidence required: The e2e/integration test name and a passing run.
- Counterexample: The greeting text is only asserted against the handler
  function in isolation, never through an actual HTTP request/response cycle.
- Applies when: The product has user-facing flows. Expand per critical flow.
- Applicability: PRD §Primary flow names exactly one flow: "1. Look. Visitor
  opens the site. Within one second, 'Hello, Venture!' is visible on the
  page."
- Status: MET — `tests/e2e/look.e2e.test.ts` starts the real Fastify server
  bound to an OS-assigned port and issues a real `fetch()` HTTP request
  against it (not `.inject()` handler-in-isolation), asserting status 200
  and the body contains "Hello, Venture!"; passing in the 4/4 `npm test` run.

## test.no-assertion-only — No criterion verified by assertion alone  [must]

- Invariant: No acceptance criterion is marked met purely by a claim; each has
  executable evidence behind it.
- Evidence required: Every MET criterion links a test or run, not prose.
- Counterexample: The spec says "handles 1k concurrent votes" with no test or
  measurement.
- Applies when: Always.
- Status: MET — Every `test.criteria-proven.*` item above names its exact
  test file and assertion, not a prose claim. The two items resolved with a
  recorded evidence gap in step 06 (`ui.theming.dark-light`,
  `ui.a11y.baseline`) are the only ones without a live-browser capture, and
  each documents exactly why (no headless-browser capability in this
  container) rather than asserting evidence that was not produced.

## test.regression-guard — Fixed bugs get a guarding test  [should]

- Invariant: Each bug fixed in this change adds a test that fails before the fix
  and passes after.
- Evidence required: The regression test committed with the fix.
- Counterexample: A bug is fixed with no test, so it can silently return.
- Applies when: The change fixes a defect.
- Applicability: `docs/prd/hello-task.md` describes new build work (a
  from-scratch minimal app), not a defect fix; no bug or reproduction is
  named.
- Status: N/A — This is new build work, not a defect fix; the PRD names no
  bug.

## perf.landing-latency — Greeting page loads within the PRD's stated bound  [must]

- Invariant: `GET /` responds with the "Hello, Venture!" HTML within
  approximately one second under normal conditions, matching the PRD's stated
  primary-flow bound.
- Evidence required: A timed test or measurement (e.g. a response-time
  assertion in the test suite, or a captured request-timing report) showing a
  sub-1-second response.
- Counterexample: The page returns the correct HTML but takes several seconds
  to respond, silently violating the PRD's stated flow, with nothing catching
  it.
- Applies when: The PRD states a response-time bound for a primary flow.
- Applicability: PRD §Primary flow, step 1 ("Look"): "Within one second,
  'Hello, Venture!' is visible on the page." This is not one of the 3 listed
  §Acceptance Criteria, so `test.criteria-proven` does not cover it; added per
  the PRD's own stated flow requirement, using the response-latency
  measurement pattern from the installed `general-performance-optimization`
  skill.
- Status: MET — `tests/e2e/look.e2e.test.ts` measures wall-clock time around
  the real `fetch()` call (`performance.now()` before/after) and asserts
  `elapsedMs < 1000`; passing (observed low single-digit milliseconds against
  localhost in this invocation, well under the bound).
