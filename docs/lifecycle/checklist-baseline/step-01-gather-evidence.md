# Baseline Checklist — Step 01: Gather evidence

Gate (from app-building.md): Every theme carries an evidence count; every
implication is routed.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## evidence.sources-preserved — Raw sources kept, not just conclusions  [must]

- Invariant: Each research summary links or embeds the raw sources it draws from
  (interview notes, tickets, competitor pages), so a claim can be traced back.
- Evidence required: `docs/research/<topic>-summary.md` with source references
  that resolve.
- Counterexample: A summary asserts "users want X" with no source behind it.
- Applies when: The step runs (skipped for already-scoped work per app-building's
  skip rules).
- Status: PENDING

## evidence.themes-counted — Every theme has an evidence count  [must]

- Invariant: Each synthesized theme states how many distinct sources support it,
  so weak signals are visibly weak.
- Evidence required: A themes table or list where each row carries a count.
- Counterexample: A theme is presented as strong on the strength of one anecdote.
- Applies when: The step runs.
- Status: PENDING

## evidence.implications-routed — Every implication has a destination  [must]

- Invariant: Each implication is routed to a concrete next artifact — a PRD
  requirement, a roadmap item, or an explicit non-goal — not left as an
  observation.
- Evidence required: Each implication line names where it goes.
- Counterexample: The summary lists findings that never become a decision.
- Applies when: The step runs.
- Status: PENDING
