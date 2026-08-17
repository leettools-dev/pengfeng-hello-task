# Baseline Checklists

One opinionated, human-maintained baseline checklist per step of the
[app-building lifecycle](../app-building.md). This is the **source of truth** for
what "done" means at each step — curated by people in this repository, not
re-derived by an agent on every run.

## How they are used

`lifecycle-instantiate` (the agent step driven by
[instantiate.prompt.md](../instantiate.prompt.md)) does **not** invent a
checklist. For each applicable step it starts from the matching
`step-NN-<slug>.md` here, copies it into the product's
`docs/lifecycle/checklist/`, and then:

- **Specializes** each baseline item to the concrete entities the PRD names —
  expanding "per route / per table / per role" collections into one item each.
- **Resolves applicability** using each item's `Applies when` line: it quotes
  the clause, records the evidence for or against as an `Applicability` line,
  and only then sets the status. An item the PRD excludes becomes
  `Status: N/A — <PRD citation>`. A `must` item is never silently dropped;
  non-applicability is an N/A with a citation. An item kept as `PENDING` carries
  the positive finding that justified keeping it — the failure mode this closes
  is an item whose condition was never true being instantiated `PENDING` and
  reaching the completion gate before anyone reads the condition.
- **Resolves external capabilities** against the step-00 capability record. An
  item blocked by a capability the environment does not have — no git hosting,
  no staging environment, no usage meter, no telemetry or analytics sink —
  becomes `Status: N/A — capability:<probe-id> unavailable — <evidence>` at
  instantiation, not `PENDING` at the gate. The checker requires a matching
  `unavailable` (or `not-applicable`) probe in the record, so the citation is a
  probe result rather than an assertion.
- **Extends** with product-specific items the PRD warrants that the baseline
  does not already cover.

So the baseline is the floor; the PRD raises it. Improving the floor for every
future product is a one-file human edit here.

## File shape

Each file is a valid checklist in the shape
[`check-checklist.ts`](../../../scripts/check-checklist.ts) parses, so a
specialized copy validates without reformatting:

```markdown
## <id> — <short name>  [must|should]

- Invariant: <black-box statement true of the artifact or running system>
- Evidence required: <a command, test name, captured screen, or report>
- Counterexample: <a concrete failure that must not pass>
- Applies when: <deterministic condition, e.g. "the product has any web UI">
- Status: PENDING
```

The instantiated copy carries the same fields plus one more: an `Applicability`
line whenever `Applies when` is conditional. `Always` and `The step runs` need
no finding; anything else does, and the checker enforces its presence.

```markdown
- Applies when: The product has end users and the PRD states success metrics.
- Applicability: PRD §Success has no metrics — "Build a hello world web app".
- Status: N/A — PRD §Success states no success metrics.
```

## Rules for editing a baseline

- **Black-box only.** State an invariant true of the built artifact or the
  running system and the evidence that proves it. Never name a skill, a library,
  a phase number, or an implementation path — the same rule the lifecycle applies
  to skills.
- **Every item carries a degree.** `must` = launch-blocking; `should` = expected
  but may carry a cited exception.
- **`Applies when` must be deterministic.** It has to be answerable from the PRD,
  the profile (`.agents/skill-instantiation.json`), or the capability record
  alone, so instantiation can decide `PENDING` vs `N/A` without guessing.
- **Lead with the condition when the condition is the point.** An invariant that
  states the behavior first and hides the branch in a separate field is the one a
  hurried instantiation misses. Write "When the PRD states success metrics, the
  product emits …", not "The product emits …".
- **An item that depends on an external capability says which probe decides it.**
  Name the capability class in `Applies when` and the `capability:<probe-id>`
  form the `N/A` takes. An item whose enabling capability nothing probes at
  step 00 is a blocker discovered at the step that consumes it, by an invocation
  that cannot fix it.
- **Keep them terse and stable.** Product-specific detail belongs in the
  instantiated copy, not here.

## The set

| Step | File | Gate focus |
|------|------|-----------|
| 0 | [step-00-scaffold](step-00-scaffold.md) | Green runnable baseline |
| 1 | [step-01-gather-evidence](step-01-gather-evidence.md) | Evidence counted and routed |
| 2 | [step-02-define-product](step-02-define-product.md) | Testable criteria, explicit non-goals |
| 3 | [step-03-roadmap](step-03-roadmap.md) | Now/Next linked to PRD and evidence |
| 4 | [step-04-engineering-contract](step-04-engineering-contract.md) | API, auth, data, config contract |
| 5 | [step-05-implementation-plan](step-05-implementation-plan.md) | Tasks with paths and verification |
| 6 | [step-06-build](step-06-build.md) | Cross-cutting UI/product standards |
| 7 | [step-07-prove-it-works](step-07-prove-it-works.md) | Criteria proven, suite green |
| 8 | [step-08-review](step-08-review.md) | Self-review before others |
| 9 | [step-09-pull-request](step-09-pull-request.md) | Reviewable PR, CI green |
| 10 | [step-10-release](step-10-release.md) | Version and changelog agree |
| 11 | [step-11-deploy](step-11-deploy.md) | Staging before prod, verified |
| 12 | [step-12-tell-people](step-12-tell-people.md) | Docs and comms match shipped |
| 13 | [step-13-operate](step-13-operate.md) | Alerts, runbooks, analytics live |
| 14 | [step-14-close-loop](step-14-close-loop.md) | Findings filed, loop closed |
