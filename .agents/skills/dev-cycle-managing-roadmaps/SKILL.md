---
name: dev-cycle-managing-roadmaps
description: "Maintain docs/roadmap.md as a prioritized, evidence-linked backlog with Now/Next/Later milestones; update it when features ship, research lands, or priorities change."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Managing the Roadmap

## Overview

`docs/roadmap.md` is the single ordered list of what the product will do next
and why. The scaffold creates it once; this skill keeps it true. A roadmap that
isn't updated when features ship or research lands is worse than none — agents
and humans will plan against fiction.

Use this skill when:
- A research summary or PRD produces new candidate work
- A feature ships (move it out of the backlog, into the changelog)
- Priorities change or a milestone is planned
- The user asks "what should we build next?"

## Roadmap Format

Keep the whole roadmap in one file with three horizons:

```markdown
# Roadmap

## Now (committed, in progress)
| Feature | PRD | Why now | Size | Status |
|---------|-----|---------|------|--------|

## Next (prioritized, not started)
| Feature | Evidence | Value | Effort | Score |
|---------|----------|-------|--------|-------|

## Later (captured, unranked)
- <one-line ideas with an evidence link when one exists>

## Shipped
| Feature | Shipped | Release notes |
|---------|---------|---------------|
```

Rules:
- Every **Now** row links a PRD in `docs/prd/`. No PRD, no commitment.
- Every **Next** row links evidence — a `docs/research/` summary, customer
  request, or metric. "Founder intuition" is allowed but must be labeled.
- **Later** is a capture bucket. Do not rank it; do not let it leak into Next
  without scoring.

## Prioritization

Score **Next** items with value/effort — deliberately simple for a solo team:

| Field | Scale |
|-------|-------|
| Value | 1–5: revenue, retention, or unblocking evidence-backed demand |
| Effort | 1–5: relative implementation size including tests and docs |
| Score | Value ÷ Effort, then hand-adjust for dependencies and risk |

The score orders the conversation; it does not replace judgment. Record the
reason whenever the ordering disagrees with the score.

## Update Triggers

| Event | Roadmap action |
|-------|----------------|
| Research summary lands | Add/rescore Next items, cite the summary |
| PRD accepted | Promote item to Now with the PRD link |
| Feature ships (`cut-release`) | Move to Shipped, link release notes from `gtm/marketing/` |
| Milestone review or pivot | Rescore Next, prune Later items older than ~6 months |
| Incident or postmortem action item (`ops-responding-to-incidents`) | Add remediation work to Now or Next explicitly |

## Anti-Patterns

- **The frozen roadmap.** Generated at scaffold time, never touched again.
- **Everything is Now.** More than ~3 concurrent Now items for a solo founder means nothing is committed.
- **Evidence-free promotion.** Items sliding from Later to Next because they were mentioned recently, not because evidence arrived.
- **Roadmap as changelog only.** If the Shipped section grows but Next never reorders, the roadmap is being back-filled, not used.

## Checklist

- [ ] Now items each link a PRD
- [ ] Next items each link evidence and carry a value/effort score
- [ ] Shipped section updated in the same PR that ships the feature
- [ ] Ordering disagreements with the score have a recorded reason
- [ ] Later pruned of stale items at milestone reviews
