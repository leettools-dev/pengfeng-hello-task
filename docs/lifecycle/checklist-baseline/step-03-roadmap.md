# Baseline Checklist — Step 03: Decide what is next

Gate (from app-building.md): Every Now item links a PRD; every Next item links
evidence.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## roadmap.now-links-prd — Now items trace to a PRD  [must]

- Invariant: Every item in the Now section links the PRD (or PRD section) that
  justifies working on it now.
- Evidence required: `docs/roadmap.md` Now items with resolving PRD links.
- Counterexample: A Now item exists with no PRD behind it.
- Applies when: The step runs (skipped for already-scoped work).
- Status: PENDING

## roadmap.next-links-evidence — Next items trace to evidence  [must]

- Invariant: Every item in the Next section links the research/evidence that
  argues for it, so prioritization is defensible.
- Evidence required: Next items with resolving evidence links.
- Counterexample: A Next item is a hunch with nothing behind it.
- Applies when: The step runs.
- Status: PENDING

## roadmap.single-source — One roadmap, no parallel backlog  [should]

- Invariant: The roadmap is the single ordered source of what is next; decisions
  are not split across issues nobody reconciles.
- Evidence required: `docs/roadmap.md` is current and referenced as the source.
- Counterexample: The real priorities live in a chat thread the roadmap
  contradicts.
- Applies when: The step runs.
- Status: PENDING
