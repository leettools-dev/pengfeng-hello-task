# Baseline Checklist — Step 07: Prove it works

Gate (from app-building.md): Full suite green on the branch; each acceptance
criterion has passing evidence; no criterion verified by assertion alone.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## test.suite-green — Full suite passes on the branch  [must]

- Invariant: The complete test suite runs and passes on the feature branch, not
  just a subset the author picked.
- Evidence required: Full-suite run output, or the CI run for the branch.
- Counterexample: Tests pass locally with one file skipped that fails in CI.
- Applies when: Always.
- Status: PENDING

## test.criteria-proven — Each acceptance criterion has a passing test  [must]  (per criterion)

- Invariant: Every PRD acceptance criterion is backed by a named test that
  exercises the real behavior and passes.
- Evidence required: A criterion → passing test-name mapping.
- Counterexample: A criterion is "verified" by a test that asserts `true`.
- Applies when: Always. Expand per acceptance criterion.
- Status: PENDING

## test.critical-flows-e2e — Critical user flows have end-to-end coverage  [must]  (per flow)

- Invariant: Each critical end-to-end flow the PRD names has an automated test
  that drives it through the real surfaces.
- Evidence required: The e2e test name and a passing run for each flow.
- Counterexample: "Create → share → vote → see results" is only unit-tested in
  pieces, never end to end.
- Applies when: The product has user-facing flows. Expand per critical flow.
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
- Status: PENDING
