# Baseline Checklist — Step 05: Plan the change

Gate (from app-building.md): Every task has exact paths and a verification
command; every acceptance criterion appears in the test plan.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## plan.tasks-concrete — Every task names exact paths  [must]

- Invariant: Each task lists the files it will create or change and the command
  that verifies it — no task is "wire up the backend" with no paths.
- Evidence required: `docs/plans/<feature>.md` with per-task file paths and a
  verification command each.
- Counterexample: A task says "add tests" without naming what or where.
- Applies when: The step runs (skipped for a single-function change).
- Status: PENDING

## plan.criteria-covered — Every acceptance criterion is in the test plan  [must]

- Invariant: Each PRD acceptance criterion maps to at least one planned test, so
  nothing ships unverified by construction.
- Evidence required: A criterion → test mapping in the plan.
- Counterexample: A criterion has no test planned against it.
- Applies when: The step runs.
- Status: PENDING

## plan.slices-reviewable — Work is sliced into reviewable units  [should]

- Invariant: The plan breaks the change into small, independently reviewable and
  mergeable slices rather than one large drop.
- Evidence required: An ordered list of slices, each shippable on its own.
- Counterexample: The plan is a single task that produces a 3,000-line PR.
- Applies when: The step runs.
- Status: PENDING

## plan.risks-and-rollback — Risky changes name their fallback  [should]

- Invariant: Any task touching data, auth, or a live surface names its risk and
  how to back it out.
- Evidence required: A risk/rollback note on the relevant tasks.
- Counterexample: A destructive migration is planned with no rollback path.
- Applies when: The plan includes a migration, auth change, or deploy-affecting
  change.
- Status: PENDING
