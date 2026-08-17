# Lifecycle: App Building

The sequence for taking an application from a PRD to production and day-2
operations. This is the default lifecycle installed into a product repository;
the product owns its copy and may edit it.

One rule governs edits here: **this file names skills; skills never name this
file.** A skill is a capability and must stay usable in work that follows a
different sequence, so nothing under `skills/` may reference a lifecycle, a
phase number, or a preceding or following step.

## How to Read the Table

- **Artifact** — the file or output the step must leave behind. A step with no
  artifact leaves nothing for the next step to check, and did not happen.
- **Gate** — what must pass before the next step starts. A failing gate sends
  work back, it does not get noted and skipped.
- **Skills** — the capabilities reached for. Named skills are loaded on demand;
  they do not know their position in this list.

`general-operating-safely` is not a step. It applies at every step that touches
production data, destructive commands, or a deployed system.

`general-delivering-changes-with-git` is also lifecycle-wide. Load it for every
step that changes the repository so recovered commits are preserved,
dependency manifests and lockfiles stay consistent with CI, local CI parity is
proved before handoff, and the branch is left clean for the authority that
opens and merges the PR.

## Meta-Principles

- **Human-preferred decisions require auto policy.** Any question that would
  ideally be answered by a human expert must also have a documented best-effort
  policy for full-auto mode. The policy names the inputs to inspect, the default
  choice, the reason that choice is safest or most reversible, the evidence to
  record, and the boundary where automation must still stop. Full-auto runs use
  that policy as actor `auto-policy`; human-gated runs emit the same question as
  a Decision. If no policy exists, the missing policy is itself the finding.

## Steps

| # | Goal | Artifact | Skills | Gate |
|---|------|----------|--------|------|
| 0 | Scaffold the repo | Standard layout, runnable hello-world, `.agents/toolchain-lock.json` | `meta-scaffolding-product-ventures` | `npm install && npm test && npm run dev` all pass |
| 1 | Gather evidence | `docs/research/<topic>-summary.md` with raw sources preserved | `dev-cycle-synthesizing-research` | Every theme carries an evidence count; every implication is routed |
| 2 | Define the product | `docs/prd/<feature>.md` — problem, users, flows, acceptance criteria, non-goals | — | Acceptance criteria are testable; non-goals are explicit |
| 3 | Decide what is next | `docs/roadmap.md` updated | `dev-cycle-managing-roadmaps` | Every Now item links a PRD; every Next item links evidence |
| 4 | Fix the engineering contract | `docs/dev-spec.md`, `design/architecture.md` | `dev-cycle-writing-dev-specs`, `general-designing-apis`, `security-designing-authentication`, `security-designing-authorization`, `general-migrating-data-schemas`, `general-managing-configuration` | Every checklist item labeled Specification or Guidance with a compliance degree; clarifications resolved, not guessed |
| 5 | Plan the change | `docs/plans/<feature>.md` | `dev-cycle-planning-implementation`, `general-testing-strategies` | Every task has exact paths and a verification command; every acceptance criterion appears in the test plan |
| 6 | Build it | Code, tests, updated Progress Log in `docs/dev-spec.md` | `backend-typescript-building-fastify-services`, `frontend-typescript-building-react-frontends`, `general-handling-errors`, `typescript-implementing-logging`, `general-writing-commit-messages` | Every plan task's verification command passes; spec Progress Log current |
| 7 | Prove it works | Test run output; new tests committed with the code | `general-testing-strategies`, `testing-typescript-applications`, `testing-with-playwright`, `general-performance-optimization` | Full suite green on the branch; each acceptance criterion has passing evidence; no criterion verified by assertion alone |
| 8 | Review before asking others | Review findings addressed or recorded | `/code-review`, `general-reviewing-design-with-aposd`, `/simplify`, `general-frontend-audit` | Self-review done; no unexplained deviation from `docs/dev-spec.md` |
| 9 | Open the PR | Pull request with summary, changes, test plan | `pr`, `general-writing-commit-messages`, `code-respond-to-feedbacks` | CI green; a reviewer other than the author has approved — a separate review agent counts, "no reviewer" never does |
| 10 | Cut the release | Tag, changelog entry | `cut-release` | Version and changelog agree with what merged |
| 11 | Deploy | Deployed staging then production; rollback and unattended-renewal paths confirmed | `system-deploying-environments`, `system-developing-with-docker`, `system-managing-domains-and-tls`, `general-operating-safely` | Staging verified before production; health check, critical-flow smoke test, ~10 minutes of error-rate observation, and renewal proof for every expiring dependency pass. A deploy is done when verification and durability pass, not when apply exits 0 |
| 12 | Tell people | `gtm/documentation/`; `gtm/marketing/` and `gtm/sales/` only when the PRD names those audiences/channels | `gtm-generating-launch-artifacts`, `gtm-writing-user-documentation`, `gtm-writing-release-communications`, `gtm-writing-sales-collateral` | User-facing docs match shipped behavior; release, marketing, and sales artifacts are required only when their PRD-scoped applicability holds |
| 13 | Operate it | `ops/alerts/`, `ops/runbooks/`, analytics events live | `general-setting-up-observability`, `ops-defining-alerts-and-slos`, `ops-responding-to-incidents`, `general-instrumenting-product-analytics` | Alerts exist for the failure modes named in the dev spec; runbook exists for each alert |
| 14 | Close the loop | `docs/roadmap.md` — feature moved to Shipped; new evidence filed to `docs/research/` | `dev-cycle-managing-roadmaps`, `dev-cycle-synthesizing-research` | Shipped section updated; incident and analytics findings entered as Now or Next items, not left in someone's head |

## Skipping Steps

Steps 1–3 are skipped for work that arrives already scoped — a bug fix with a
reproduction, a dependency bump. Step 5 is skipped for a single-function change.
Step 12 may be skipped when the PRD explicitly has no end-user documentation,
release-communication, marketing, or sales audience. Within an applying Step
12, marketing and sales remain opt-in rather than launch defaults. Steps 0, 4,
6–11, and 13–14 are not skippable for anything that reaches production.

A skipped step is a decision. Record it in the PR description; do not leave the
gate silently unmet.

## When This Lifecycle Does Not Fit

If the goal is not "build and operate an application" — a research spike, a
library release, a security audit, a data migration with no feature attached —
write a different file in `docs/lifecycle/` rather than forcing the work
through these gates. The skills are shared; the sequence is not.
