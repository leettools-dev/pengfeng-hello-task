# Baseline Checklist — Step 14: Close the loop

Gate (from app-building.md): Shipped section updated; incident and analytics
findings entered as Now or Next items, not left in someone's head.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## loop.shipped-updated — The feature is moved to Shipped  [must]

- Invariant: The roadmap's Shipped section records this feature, so the roadmap
  reflects reality.
- Evidence required: `docs/roadmap.md` Shipped entry for the feature.
- Counterexample: The feature is live but still sits under Now.
- Applies when: The step runs.
- Status: PENDING

## loop.findings-filed — Incident and analytics findings become roadmap items  [must]

- Invariant: What was learned in operation — incidents, analytics surprises,
  follow-ups — is filed as Now/Next items or research evidence, not left in
  someone's memory.
- Evidence required: New roadmap or `docs/research/` entries citing the findings.
- Counterexample: An incident postmortem's action items are never tracked.
- Applies when: The step runs.
- Status: PENDING
