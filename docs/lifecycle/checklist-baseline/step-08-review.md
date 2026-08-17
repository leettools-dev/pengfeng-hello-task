# Baseline Checklist — Step 08: Review before asking others

Gate (from app-building.md): Self-review done; no unexplained deviation from
`docs/dev-spec.md`.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## review.self-done — A code review ran and findings are addressed  [must]

- Invariant: The change has been reviewed for correctness and clarity, and each
  finding is either fixed or recorded with a reason to defer.
- Evidence required: Review findings with a resolution against each.
- Counterexample: The PR opens with known issues nobody noted.
- Counterexample: Known dead code is left in with no note.
- Applies when: Always.
- Status: PENDING

## review.simplify — A simplification pass ran  [should]

- Invariant: The change was checked for duplication, needless complexity, and
  reuse of existing utilities, and reducible complexity was reduced.
- Evidence required: Simplification findings addressed, or a note that none
  applied.
- Counterexample: The diff reimplements a helper that already exists.
- Applies when: Always.
- Status: PENDING

## review.spec-conformance — No unexplained deviation from the dev spec  [must]

- Invariant: The implementation matches `docs/dev-spec.md`; any deviation is
  recorded with a reason, not left silent.
- Evidence required: A deviation list (possibly empty) reconciled against the spec.
- Counterexample: The API returns a different shape than the spec's contract with
  no explanation.
- Applies when: A dev spec exists for the change.
- Status: PENDING

## review.frontend-audit — UI changes pass a frontend audit  [should]

- Invariant: UI changes were audited for the cross-cutting standards (theming,
  states, accessibility) before review by others.
- Evidence required: A frontend audit result with issues addressed.
- Counterexample: A new screen ships without its dark-mode or error state, caught
  only after merge.
- Applies when: The change touches UI.
- Status: PENDING
