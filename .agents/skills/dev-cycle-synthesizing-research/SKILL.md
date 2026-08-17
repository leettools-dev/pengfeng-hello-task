---
name: dev-cycle-synthesizing-research
description: "Turn raw customer feedback, interviews, support threads, and competitor scans into evidence-backed research summaries in docs/research/ that feed PRDs and the roadmap."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Synthesizing Research

## Overview

PRDs written from memory encode the founder's assumptions. This skill turns raw
inputs — customer emails, interview notes, support threads, competitor
observations, usage data — into research summaries under `docs/research/` that
a PRD or roadmap decision can cite as evidence.

Use this skill when:
- New customer feedback, interview notes, or support threads have accumulated
- Evaluating a competitor or market segment before scoping a feature
- A PRD claim needs evidence ("users want X" — says who?)
- Product analytics results need interpretation (see `general-instrumenting-product-analytics`)

Skip this skill when the input is a single obvious bug report — file it
directly against the roadmap or as an issue.

## Process

### Step 1: Capture Raw Input Verbatim

Store the raw material in `docs/research/raw/` (or link the external source).
Never paraphrase at capture time — synthesis loses information, and future
questions need the original wording.

### Step 2: Separate Observations from Interpretations

For each source, extract observations first, then interpret:

```markdown
## Observations (what was said or measured)
- "I export to CSV every Friday and re-import into Sheets" (customer A, 2026-07-02)
- 4 of 6 interviewees mentioned manual export steps

## Interpretations (what we think it means)
- Weekly reporting is a recurring job our product doesn't finish
```

An observation quotes or counts. An interpretation is a hypothesis and must be
labeled as one.

### Step 3: For Competitors, Use a Fixed Snapshot Format

```markdown
# Competitor: <name>  (snapshot <date>)

| Aspect | Notes |
|--------|-------|
| Target user | |
| Core workflow | |
| Pricing | |
| Strengths | |
| Gaps we can exploit | |
| Threat level | low / medium / high + why |
```

Date every snapshot — competitor facts go stale, and an agent must be able to
tell a 2-year-old observation from a current one.

### Step 4: Synthesize Themes with Evidence Counts

Write the summary document `docs/research/<topic>-summary.md`:

```markdown
# Research Summary: <topic>

## Themes
1. <theme> — supported by N sources: [raw links]
2. ...

## Contradictions
- <where sources disagree, and what would resolve it>

## Implications
- <candidate feature / PRD change / roadmap move, each linked to its theme>
```

A theme cited by one source is an anecdote; say so. Never present an
interpretation without its supporting observation count.

### Step 5: Route the Output

- Feature-sized implication → new or updated PRD in `docs/prd/`
- Priority-sized implication → roadmap update via `dev-cycle-managing-roadmaps`
- Open question → record it in the summary's Contradictions section, don't guess

## Output

- Raw inputs preserved under `docs/research/raw/`
- Dated summary in `docs/research/` with themes, evidence counts, and implications
- Linked follow-ups in PRDs or the roadmap

## Anti-Patterns

- **Synthesis at capture time.** Paraphrasing a customer email and discarding the original destroys evidence.
- **Anecdote inflation.** "Users are asking for X" when one user asked once.
- **Undated competitor claims.** A pricing observation without a date is a liability, not an asset.
- **Research that goes nowhere.** Every summary must end in an implication routed to a PRD, the roadmap, or an explicit open question.

## Checklist

- [ ] Raw inputs stored verbatim or linked
- [ ] Observations separated from interpretations
- [ ] Competitor snapshots dated and in the fixed format
- [ ] Themes carry evidence counts with links to raw sources
- [ ] Every implication routed to a PRD, roadmap item, or open question
