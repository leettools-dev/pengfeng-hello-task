# Lifecycle Plan: Hello Task

Instantiated from: `docs/prd/hello-task.md`, `docs/lifecycle/app-building.md`,
`docs/lifecycle/checklist-baseline/`
Profile: language=typescript, backend=fastify, frontend=react (declared in
`.agents/skill-instantiation.json`, but unused here — PRD Requirements: "No
frontend framework needed — served HTML is enough"), deploy_target=gcp (via
`leet-deploy`, domain `hello-task.pengfeng.leettools.ai`)

| # | Goal | Applies | Reason (PRD-cited) | Artifact path | Checklist |
|---|------|---------|--------------------|---------------|-----------|
| 0 | Scaffold the repo | APPLIES | Baseline — every venture scaffolds | `src/app/`, `tests/`, `.agents/toolchain-lock.json` | [step-00](checklist/step-00-scaffold.md) |
| 1 | Gather evidence | SKIPPED | PRD §Problem: "This PRD exists to exercise the Foreman delivery path as cheaply as possible: use it when testing infrastructure ... rather than product logic" — the work is deliberately not evidence/research-driven; there is no customer signal to synthesize | — | — |
| 2 | Define the product | APPLIES | `docs/prd/hello-task.md` already states problem, users, flow, acceptance criteria, and non-goals | `docs/prd/hello-task.md` | [step-02](checklist/step-02-define-product.md) |
| 3 | Decide what is next | APPLIES | PRD is a real, buildable unit of work; `docs/roadmap.md` exists but has no entry for this PRD yet | `docs/roadmap.md` | [step-03](checklist/step-03-roadmap.md) |
| 4 | Fix the engineering contract | APPLIES | PRD §Requirements names two routes and §Technical Notes names the stack; contract not yet written (`docs/dev-spec.md` does not exist) | `docs/dev-spec.md`, `design/architecture.md` | [step-04](checklist/step-04-engineering-contract.md) |
| 5 | Plan the change | APPLIES | Greenfield build of a new Fastify app (two routes, tests, deploy) — not a single-function change | `docs/plans/hello-task.md` | [step-05](checklist/step-05-implementation-plan.md) |
| 6 | Build it | APPLIES | PRD §Requirements: `/` greeting route not yet implemented (only `/health` exists in `src/app/src/server.ts`) | `src/app/src/`, `tests/`, `docs/dev-spec.md#progress-log` | [step-06](checklist/step-06-build.md) |
| 7 | Prove it works | APPLIES | PRD §Acceptance Criteria states 3 testable criteria not yet all covered | `tests/`, CI run output | [step-07](checklist/step-07-prove-it-works.md) |
| 8 | Review before asking others | APPLIES | Not skippable per app-building.md | Review findings log | [step-08](checklist/step-08-review.md) |
| 9 | Open the PR | APPLIES | Not skippable; capability record shows git hosting `available` (`leettools-dev/pengfeng-hello-task`) | GitHub PR body | [step-09](checklist/step-09-pull-request.md) |
| 10 | Cut the release | APPLIES | Not skippable per app-building.md | Git tag, changelog entry | [step-10](checklist/step-10-release.md) |
| 11 | Deploy | APPLIES | Not skippable; capability record shows deploy target `available` (`leet-deploy`, `hello-task.pengfeng.leettools.ai`) | production: `hello-task.pengfeng.leettools.ai` | [step-11](checklist/step-11-deploy.md) |
| 12 | Tell people | APPLIES | PRD §Users names an end user (anonymous visitor); user docs still required even though no marketing/sales/release audience is named | `gtm/documentation/` | [step-12](checklist/step-12-tell-people.md) |
| 13 | Operate it | APPLIES | Not skippable; product runs a deployed service | `ops/alerts/`, `ops/runbooks/` | [step-13](checklist/step-13-operate.md) |
| 14 | Close the loop | APPLIES | Not skippable per app-building.md | `docs/roadmap.md`, `docs/research/` | [step-14](checklist/step-14-close-loop.md) |
