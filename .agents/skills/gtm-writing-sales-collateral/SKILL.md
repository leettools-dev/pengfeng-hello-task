---
name: gtm-writing-sales-collateral
description: "Draft feature sheets, objection-handling entries, and customer-request follow-up emails under gtm/sales/ — closing the loop from shipped features back to the people who asked for them."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Writing Sales Collateral

## Overview

`gtm/sales/` arms sales conversations — for a solo founder, that's usually the
founder themselves. Its highest-value artifact is the **request follow-up**:
when a shipped feature traces back to a customer who asked for it, a tailored
"you asked, we built it" draft converts better than any campaign.

Use this skill when:
- A shipped feature maps to customer requests in `docs/research/` (usually via `gtm-generating-launch-artifacts`)
- A recurring objection needs a prepared, honest answer
- A feature or the product needs a one-page summary for an evaluation

All output is a draft; the human confirms recipients and sends.

## Artifact Formats

### Feature sheet (`gtm/sales/sheets/<feature>.md`)

```markdown
# <Feature> — one-pager

**For:** <persona / segment>
**Problem:** <the pain, in the customer's words — quote research if possible>
**How it works:** <3–5 plain-language steps or bullets>
**Proof:** <measurement, guide link, or demo path>
**Availability & pricing:** <plan/tier; "included" is an answer>
```

### Objection handling (`gtm/sales/objections.md`)

```markdown
## "<objection, verbatim as customers say it>"
- **Honest answer:** <what's true today, including limits>
- **Counter-positioning:** <what we do instead and why it can be better>
- **If it's a real gap:** <roadmap link or "not planned, here's the workaround">
```

### Request follow-up (`gtm/sales/followups/<feature>-<date>.md`)

```markdown
**Recipients (to confirm):** <customers/threads from docs/research/ that requested this>
**Subject:** You asked for <their words> — it's live

<1 sentence: reference their specific request or conversation.>
<1–2 sentences: what shipped and the exact step to try it, guide link.>
<1 question: does this cover your case?>
```

## Rules

- **Trace requests through research.** Recipients come from `docs/research/`
  raw sources — this is why `dev-cycle-synthesizing-research` preserves who
  said what. Never guess who asked.
- **Honesty over spin.** An objection entry that dodges a real limitation
  poisons trust; state the limit and the workaround. Never fabricate proof
  points, customer counts, or testimonials.
- **Their words, not ours.** Sheets and follow-ups quote the customer's phrasing
  of the problem where research provides it.
- **Every claim verifiable.** Same rule as release communications: proof links
  to a measurement, guide, or demo path that exists.
- **Keep objections current.** When a roadmap item ships, update the entries
  that cited it as a gap.

## Anti-Patterns

- **Broadcast disguised as follow-up.** Sending "you asked for this" to people who didn't; recipients must trace to actual requests.
- **Marketing-brochure sheets.** Adjectives where the steps and proof should be.
- **Objection scripts that argue.** The entry equips an honest answer, not a debate victory.
- **Stale collateral.** Sheets describing v1 behavior three releases later — sweep `gtm/sales/` during each GTM pass.

## Checklist

- [ ] Follow-up recipients traced to `docs/research/` sources, marked "to confirm"
- [ ] Sheets state problem in customer vocabulary with a proof link
- [ ] Objection entries include the honest limitation
- [ ] Collateral touching shipped roadmap items updated
- [ ] Everything marked draft; human sends
