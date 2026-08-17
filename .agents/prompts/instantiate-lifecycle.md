# Prompt: Instantiate the Lifecycle Plan and Checklists

You are running inside a product venture repository with its skills already
installed. Your job is to turn this product's PRD into two concrete, checkable
deliverables: a **lifecycle plan** and a **per-step checklist set**. You produce
the *what* — the deliverables and their acceptance — not the *how*. Which skill
or technique satisfies an item is decided later, at build time, by whoever does
the work.

**You do not design the lifecycle, and you do not write checklists from
scratch.** The lifecycle is fixed (`docs/lifecycle/app-building.md`) and the
checklists have a curated baseline (`docs/lifecycle/checklist-baseline/`). Your
job is to *adopt* both and *specialize* them to this PRD — deciding what applies,
binding generic items to the concrete entities this product names, and adding
only what the PRD warrants that the baseline lacks.

Do not implement the product. Do not write application code, run migrations, or
deploy anything. Read, judge, and write the plan and checklist files described
below, then verify them.

## Read first

Read all of these before writing anything:

1. **The PRD(s):** every file under `docs/prd/`. This is the only source of
   product-specific truth. The caller has already verified mechanically that a
   real PRD exists before invoking you (see the confirmation note above this
   prompt, if present) — do not re-derive that judgment from a PRD's length,
   scope, or subject matter. A short PRD, or one that describes a deliberately
   simple feature, is still real. The exclusion rule is a first-heading match,
   not a check that the file is unedited: the *only* file ever excluded is one
   whose first heading is the exact starter title `# PRD: Hello World
   Baseline` (the scaffold ships this at `docs/prd/hello-world.md`) — a file
   that keeps that exact heading is excluded as the starter even if its body
   has been rewritten, and changing the heading is what makes an edited
   starter count as real. A file with any other heading — however minimal its
   scope reads — is a real PRD and must be instantiated against. Only if every
   file under `docs/prd/` has that exact starter heading should you stop and
   report that there is no real PRD to instantiate against.

   **Originals and expansions come in pairs.** A file named
   `<name>.expanded.md` is not a second product — it is the completed form of
   the `<name>.md` beside it, written when the original was too thin to build
   against, with every added item marked `(assumption)`. Read both. Work from
   the expansion, because it holds the acceptance criteria your checklist items
   bind to; treat the original as authoritative for **intent and scope**, and
   cite it when both state the same thing. If the two conflict, the original
   wins, the expansion has a defect, and you say so in your summary rather than
   quietly choosing one. Never instantiate a plan for the pair twice.
2. **The fixed lifecycle:** `docs/lifecycle/app-building.md`. Its step table
   (numbers, goals, artifacts, gates, skip rules) is **authoritative and not
   yours to reshape** — see "The lifecycle is fixed" below.
3. **The baseline checklists:** every file under
   `docs/lifecycle/checklist-baseline/`. These are the human-maintained,
   opinionated default of what "done" means at each step. They are your
   **starting point**, not a template to reinvent — you specialize each one, you
   do not replace it.
4. **The installed skills:** everything under `.agents/skills/`. Their SKILL.md
   files and `references/` are the **generic standard catalog** behind the
   baselines. Use them to understand and specialize a baseline item, and to
   justify any item you add — never to reintroduce a from-scratch derivation.
5. **The profile:** `.agents/skill-instantiation.json`. The `profile` block
   (language, backend, frontend, deploy target) resolves the deterministic
   `Applies when` conditions — e.g. whether there is a web UI at all.
6. **The capability record:** `.agents/capabilities.json`, and the environment
   set it was built from (`.agents/environments.json`). This is the step-00
   read-only probe of every external capability a later step consumes — git
   hosting, deploy target, environment set, budget meter, telemetry sink,
   analytics sink — with a verdict and the literal evidence behind it. It is how
   you resolve items that depend on something outside the repository. See
   "Resolving capability-dependent items" below.
7. **The architecture and spec, if present:** `design/architecture.md`,
   `docs/dev-spec.md`. Use them to bind concrete entities (routes, tables,
   roles); never let them override the PRD on scope.

## The lifecycle is fixed

The step table in `docs/lifecycle/app-building.md` — its numbers, goals, order,
and gates — is the lifecycle this repository's tools and skills are built
against. **You do not add, remove, reorder, rename, or re-goal steps, and you do
not invent your own sequence.** The plan you write reproduces those steps as-is.

Your only lifecycle decision is **per-step applicability**, and only through
app-building.md's own skip rules:

- Steps 1–3 may be `SKIPPED` for work that arrives already scoped (a bug fix with
  a reproduction, a dependency bump).
- Step 5 may be `SKIPPED` for a single-function change.
- Step 12 may be `SKIPPED` only when the PRD explicitly has no end-user
  documentation, release-communication, marketing, or sales audience.
- Steps 0, 4, 6–11, and 13–14 are **not skippable** for anything that reaches
  production.

A `SKIPPED` step still needs a PRD-cited reason. "Not built yet", "deferred", or
"unsure" is never a skip — that step `APPLIES`, and its items are `PENDING`.

## The rules that make a checklist item usable

**1. State a black-box invariant plus acceptable evidence — never an
implementation path.** An item must be verifiable against the built artifact or
the running system regardless of how it was built. "The dark-mode skill ran" is
not a check; "every screen renders in both themes with no theme-locked colors,
shown by paired captures" is. Put the detail into *what proof looks like*, not
*how to build it*.

**2. Decide applicability per item, in the open.** Every baseline item is either
`APPLIES` to this product or `N/A`, and the decision is written down rather than
implied by the status you emit. For **each** item, in order:

1. Quote its `Applies when` clause.
2. State the evidence for or against, from the PRD, the profile, or the
   capability record — by section, quote, or probe verdict.
3. Only then emit the status.

Carry both into the instantiated item: the specialized `Applies when` line, and
an `Applicability` line holding the finding. An item you keep as `PENDING` needs
the *positive* finding that justified keeping it, not silence. An `N/A` must cite
the PRD (or an approved non-goal / architecture decision, or a capability probe)
by section, quote, or probe id. "Not built yet", "deferred", or "unsure" is never
`N/A` — that is `APPLIES` with status `PENDING`.

This is the step where a mismatched item is cheap. `ops.analytics-events`
applies only when "the PRD states success metrics"; a PRD that states none and
still gets a `PENDING` costs a whole invocation at the completion gate to reach
the `N/A` you could have written here in one line. The clause is in the baseline
precisely so you read it now.

**3. Resolving capability-dependent items.** Some items depend on something
outside the repository. Read `.agents/capabilities.json` and resolve them
against its verdicts, not against optimism:

- `available` — the item `APPLIES`; cite the probe as the applicability finding.
- `unavailable` — the item is `N/A`, resolved **now**:
  `Status: N/A — capability:<probe-id> unavailable — <the probe's evidence>`.
  Record the resulting gap as debt in your closing summary. This is the whole
  point of the record: the invocation that discovers at step 11 that there is no
  staging environment cannot create one, and the invocation that discovers at
  step 13 that there is no telemetry backend cannot stand one up.
- `not-applicable` — same form as `unavailable`; the repository declares the
  capability out of scope.
- `unprobed` — **stop and report.** Do not guess, and do not instantiate the
  item as `PENDING` in the hope that a later invocation settles it. An unprobed
  capability is an open question that costs one command to answer now and an
  entire run to answer late. Name the probe, say what would resolve it (usually
  deciding the environment set, or re-running the capability preflight with the
  credentials injected), and write the blocked report described at the end of
  this prompt.

If `.agents/capabilities.json` does not exist at all, stop and report that: the
step-00 capability preflight has not been run, and every capability-dependent
item below would be a guess.

**4. Surface PRD/scaffold conflicts; never silently normalize them.** Compare
explicit technical constraints in the PRD with `.nvmrc`, `package.json`,
`.agents/toolchain-lock.json`, and the installed profile. A mismatch such as a
PRD requiring Node 20 while the scaffold pins Node 24 is a Step 0 blocker, not
permission to choose whichever file is convenient. Preserve the relevant
baseline item as `PENDING`, specialize it to name both conflicting values and
their sources, and call the conflict out in the final summary. The PRD or
scaffold policy must be amended before implementation proceeds.

## What to produce

### 1. `docs/lifecycle/plan.md` — the applicability record

Reproduce the steps of `docs/lifecycle/app-building.md` in order. This file is an
**applicability record and checklist index**, not a lifecycle you designed. For
each step copy its number and goal verbatim, decide `APPLIES` or `SKIPPED` using
only the fixed skip rules above, and write one row:

```markdown
# Lifecycle Plan: <product name>

Instantiated from: <PRD file(s)>, `docs/lifecycle/app-building.md`,
`docs/lifecycle/checklist-baseline/`
Profile: <language/backend/frontend/deploy target from the manifest>

| # | Goal | Applies | Reason (PRD-cited) | Artifact path | Checklist |
|---|------|---------|--------------------|---------------|-----------|
| 0 | Scaffold the repo | APPLIES | Baseline — every venture scaffolds | ... | [step-00](checklist/step-00-scaffold.md) |
| 4 | Fix the engineering contract | APPLIES | PRD §Data: three record types | docs/dev-spec.md | [step-04](checklist/step-04-engineering-contract.md) |
| ... |
```

Rules for the plan:

- The Goal column matches app-building.md word for word. Do not paraphrase a
  step into a different goal.
- Every `APPLIES` step that has a baseline checklist gets a checklist link (next
  section). A step whose only output is a single named artifact may link `—` if
  you judge its baseline items already fully met at instantiation; otherwise link
  the instantiated checklist.
- A `SKIPPED` row still needs a PRD-cited reason.

### 2. `docs/lifecycle/checklist/step-<NN>-<slug>.md` — specialized from the baseline

For each `APPLIES` step, **start from its baseline file**
`docs/lifecycle/checklist-baseline/step-<NN>-<slug>.md`, and write the
specialized result to `docs/lifecycle/checklist/step-<NN>-<slug>.md` (keep the
same slug). Do not start from a blank file. For every baseline item, do exactly
one of:

- **Keep and specialize it.** Bind it to the concrete entities the PRD names and
  leave `Status: PENDING`. When an item is marked a collection (`per route`,
  `per table`, `per role`, `per flow`, `per failure mode`), **expand it into one
  concrete sub-item per entity** the PRD enumerates — a generic "every route has
  a typed contract" becomes one item per actual route.
- **Mark it `N/A`.** If the item's `Applies when` is false for this PRD, set
  `Status: N/A — <PRD citation>` with the section or quote that excludes it.

**Never delete a baseline `must` item.** If it does not apply, it becomes an
`N/A` with a citation — a launch-blocking standard is not dropped silently. A
`should` may likewise be `N/A` with a citation.

Then **add** any product-specific items the PRD warrants that the baseline does
not already cover. An added item follows the same shape and carries one line of
provenance naming the PRD requirement and the generic standard (from the
installed skills) behind it. An item traceable to neither is an invention — drop
it. Do not add an item that merely restates a baseline item.

Each item keeps the baseline shape; a checker parses it:

```markdown
# Checklist — Step <NN>: <goal>

Gate (from lifecycle): <the gate text for this step>

## <item id, e.g. ui.theming.dark-light> — <short name>  [must|should]

- Invariant: <black-box statement true of the artifact or running system>
- Evidence required: <one or more concrete proof forms: a command, a test name,
  a captured screen, a generated report>
- Counterexample: <a concrete failure that must not pass>
- Applies when: <the baseline clause, specialized to this product>
- Applicability: <the finding that decided it: PRD section, profile value, or
  probe verdict — required whenever `Applies when` is conditional>
- Status: PENDING
```

`Applies when: Always` and `Applies when: The step runs` need no `Applicability`
line. Everything else does, and the checker fails an instantiation that omits
it.

The `Status` line is the single source of an item's state and takes exactly one
of three forms:

- `Status: PENDING` — applies to this product, not yet satisfied.
- `Status: MET — <evidence link or command>` — satisfied, with the proof.
- `Status: N/A — <PRD citation>` — excluded, with the PRD section or quote that
  says so. Never `N/A` for "not built yet"; that is `PENDING`.

Carry each baseline item's degree (`must`/`should`) unless the PRD explicitly
overrides it. Do not name skills, libraries, or phase numbers — the checklist
says what must be true, not how to make it true.

## Before you finish — verify your own output

1. Every step in `plan.md` reproduces app-building.md's number and goal in order;
   no step was added, dropped, reordered, or re-goaled.
2. Every `APPLIES` step with a baseline has a specialized checklist file, and
   every checklist file corresponds to an `APPLIES` step.
3. **Every baseline `must` item appears in the instantiated file** as `PENDING`,
   `MET`, or `N/A` — none silently dropped; every `N/A` cites the PRD or a
   `capability:<probe-id>` the record shows as `unavailable`/`not-applicable`.
4. Every collection item that applies was expanded to the concrete entities the
   PRD names, not left generic.
5. Every checklist item has a degree tag, an invariant, at least one evidence
   form, an `Applies when` clause, an `Applicability` finding where that clause
   is conditional, and a well-formed `Status` line; every `MET` cites its
   evidence.
6. No capability-dependent item is left `PENDING` against an `unavailable`
   probe, and no item at all rests on an `unprobed` one.
7. No item names a skill, library, or phase number; every added (non-baseline)
   item carries its one-line provenance.
8. If a deterministic checker exists (`.agents/tools/check-checklist.ts` or an
   `npm run check:checklist` script), run it and fix what it reports.

End by printing a short summary: how many steps apply, how many checklist items
per step, how many were added beyond the baseline, how many `N/A` items with
their citations, and — listed separately — every item resolved `N/A` against a
missing capability, since each of those is a capability gap the venture is
knowingly shipping without.

If anything blocked you — no real PRD, contradictory scope, a baseline item you
could not specialize — say so plainly instead of guessing, and write the report
for the person who will read it without your transcript:

- **What is blocked** — one line naming it, not a stack trace or a file path on
  its own.
- **What you found** — the files you read, the exact conflicting statements or
  the missing information, quoted.
- **What you already tried** — the readings you tested and why each failed.
- **What would unblock it** — the concrete next action: the PRD section to
  write, the decision to make, the value to supply. A blocker with no suggested
  resolution costs another run just to reproduce.

Say what you did write before you stopped, so the next run resumes from it
rather than starting over.
