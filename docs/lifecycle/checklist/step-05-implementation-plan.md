# Checklist — Step 05: Plan the change

Gate (from lifecycle): Every task has exact paths and a verification command;
every acceptance criterion appears in the test plan.

## plan.tasks-concrete — Every task names exact paths  [must]

- Invariant: Each task lists the files it will create or change and the command
  that verifies it — no task is "wire up the backend" with no paths.
- Evidence required: `docs/plans/hello-task.md` with per-task file paths and a
  verification command each.
- Counterexample: A task says "add tests" without naming what or where.
- Applies when: The step runs (skipped for a single-function change).
- Status: MET — `docs/plans/hello-task.md` §4 lists 3 tasks, each with exact
  file paths (create/modify) and a verification command whose output
  determines done/not-done.
- Note: This is a greenfield build of a small Fastify app (new `GET /` route,
  its tests, dev spec, deploy config) — not a single-function change — so the
  step is not skipped.

## plan.criteria-covered — Every acceptance criterion is in the test plan  [must]

- Invariant: Each PRD acceptance criterion maps to at least one planned test, so
  nothing ships unverified by construction.
- Evidence required: A criterion → test mapping in the plan.
- Counterexample: A criterion has no test planned against it.
- Applies when: The step runs.
- Status: MET — `docs/plans/hello-task.md` §3 Test Plan maps all 3 PRD
  acceptance criteria (row 1: AC1, row 2: AC2, row 3: AC3) plus the primary
  flow and its latency bound to named test files/commands.
- Note: The plan must map each of the 3 PRD acceptance criteria (`npm test`/
  `npm run dev`, `GET /health` → 200 `{status:"ok"}`, `GET /` → 200 HTML
  containing "Hello, Venture!") to a named planned test.

## plan.slices-reviewable — Work is sliced into reviewable units  [should]

- Invariant: The plan breaks the change into small, independently reviewable and
  mergeable slices rather than one large drop.
- Evidence required: An ordered list of slices, each shippable on its own.
- Counterexample: The plan is a single task that produces a 3,000-line PR.
- Applies when: The step runs.
- Status: MET — `docs/plans/hello-task.md` §Slices orders the 3 tasks
  (tests-first, implementation, cleanup) as independently reviewable units.

## plan.risks-and-rollback — Risky changes name their fallback  [should]

- Invariant: Any task touching data, auth, or a live surface names its risk and
  how to back it out.
- Evidence required: A risk/rollback note on the relevant tasks.
- Counterexample: A destructive migration is planned with no rollback path.
- Applies when: The plan includes a migration, auth change, or deploy-affecting
  change.
- Applicability: The plan includes a production deploy (step 11 targets
  `hello-task.pengfeng.leettools.ai` via `leet-deploy`; capability record shows
  `deploy-target` `available`). No migration or auth change is included (PRD
  has neither).
- Status: MET — `docs/plans/hello-task.md` §Risks and Rollback names the
  rollback path (redeploy the previous container image) for the one
  deploy-affecting task; no migration or auth task exists to name a fallback
  for.
