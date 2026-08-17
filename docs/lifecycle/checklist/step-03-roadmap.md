# Checklist — Step 03: Decide what is next

Gate (from lifecycle): Every Now item links a PRD; every Next item links
evidence.

## roadmap.now-links-prd — Now items trace to a PRD  [must]

- Invariant: Every item in the Now section links the PRD (or PRD section) that
  justifies working on it now.
- Evidence required: `docs/roadmap.md` Now items with resolving PRD links.
- Counterexample: A Now item exists with no PRD behind it.
- Applies when: The step runs (skipped for already-scoped work).
- Status: PENDING
- Note: `docs/roadmap.md` currently lists only generic scaffold milestones
  (M0, M1) with no entry for `docs/prd/hello-task.md`. A Now row linking the
  PRD is needed.

## roadmap.next-links-evidence — Next items trace to evidence  [must]

- Invariant: Every item in the Next section links the research/evidence that
  argues for it, so prioritization is defensible.
- Evidence required: Next items with resolving evidence links.
- Counterexample: A Next item is a hunch with nothing behind it.
- Applies when: The step runs.
- Status: PENDING
- Note: Step 1 (Gather evidence) is SKIPPED for this PRD (PRD §Problem:
  "exercise the Foreman delivery path as cheaply as possible ... rather than
  product logic"), so no evidence-backed Next items are expected. The
  invariant is satisfiable by leaving the Next section empty (vacuously true) —
  it is PENDING, not N/A, because `docs/roadmap.md` has not yet been
  restructured to reflect that decision explicitly.

## roadmap.single-source — One roadmap, no parallel backlog  [should]

- Invariant: The roadmap is the single ordered source of what is next; decisions
  are not split across issues nobody reconciles.
- Evidence required: `docs/roadmap.md` is current and referenced as the source.
- Counterexample: The real priorities live in a chat thread the roadmap
  contradicts.
- Applies when: The step runs.
- Status: PENDING
