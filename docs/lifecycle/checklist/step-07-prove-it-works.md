# Checklist — Step 07: Prove it works

Gate (from lifecycle): Full suite green on the branch; each acceptance
criterion has passing evidence; no criterion verified by assertion alone.

## test.suite-green — Full suite passes on the branch  [must]

- Invariant: The complete test suite runs and passes on the feature branch, not
  just a subset the author picked.
- Evidence required: Full-suite run output, or the CI run for the branch.
- Counterexample: Tests pass locally with one file skipped that fails in CI.
- Applies when: Always.
- Status: PENDING

## test.criteria-proven.ac1-npm-test-dev — AC1: `npm test` passes and `npm run dev` serves locally  [must]

- Invariant: `npm test` exits 0 and `npm run dev` starts the server and serves
  requests locally, exercised by an automated check, not a claim.
- Evidence required: Named test/command output for both halves of the
  criterion.
- Counterexample: `npm test` is green but `npm run dev` was never actually run.
- Applies when: Always. Expand per acceptance criterion (this is
  `test.criteria-proven` expanded for PRD §Acceptance Criteria item 1).
- Status: PENDING

## test.criteria-proven.ac2-health — AC2: `GET /health` returns 200 `{status:"ok"}`  [must]

- Invariant: A named test issues `GET /health` and asserts status 200 and body
  `{ "status": "ok" }`.
- Evidence required: The passing test name (e.g. `tests/unit/health.test.ts`)
  and its output.
- Counterexample: The criterion is "verified" by manual inspection only.
- Applies when: Always. Expand per acceptance criterion (this is
  `test.criteria-proven` expanded for PRD §Acceptance Criteria item 2).
- Status: PENDING
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
- Status: PENDING
- Note: No `/` route exists yet in `src/app/src/server.ts` — this criterion
  has no implementation or test yet.

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
- Status: PENDING

## test.no-assertion-only — No criterion verified by assertion alone  [must]

- Invariant: No acceptance criterion is marked met purely by a claim; each has
  executable evidence behind it.
- Evidence required: Every MET criterion links a test or run, not prose.
- Counterexample: The spec says "handles 1k concurrent votes" with no test or
  measurement.
- Applies when: Always.
- Status: PENDING

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
- Status: PENDING
