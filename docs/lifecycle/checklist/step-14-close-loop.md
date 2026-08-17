# Checklist — Step 14: Close the loop

Gate (from lifecycle): Shipped section updated; incident and analytics
findings entered as Now or Next items, not left in someone's head.

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
- Note: Analytics is N/A for this PRD (`ops.analytics-events`, step 13), so
  only incident findings (if any occur during the production rehearsal/deploy)
  would apply here.
