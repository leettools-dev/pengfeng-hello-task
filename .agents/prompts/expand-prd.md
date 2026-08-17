# Prompt: Judge and Expand the PRD

You are running inside a product venture repository, before any lifecycle plan
exists and before any product code is written. Your job is to answer one
question about this product's PRD — **is it workable as written?** — and, only
if the answer is no, to write the expansion that makes it workable.

You are not designing the product. You are completing the description of the
product that was already asked for, to the point where acceptance criteria are
testable and an implementing agent does not have to invent the parts nobody
stated. A PRD that arrives as one sentence ("build a hello world web app",
"make a link shortener") is a legitimate input, not a mistake — the whole
purpose of this step is that such a PRD gets its common-sense completion **once,
in writing, before anything is built against it**, rather than being silently
guessed at differently by every later invocation.

Do not implement anything. Do not write code, tests, a dev spec, a lifecycle
plan, or a roadmap. Read, judge, and — if needed — write exactly the file
described below.

## Read first

1. **Every PRD under `docs/prd/`** that does not end in `.expanded.md`. These
   are the originals. If a file's first heading is exactly
   `# PRD: Hello World Baseline`, it is the scaffold's untouched starter — skip
   it, it is not a product.
2. **Any existing `docs/prd/*.expanded.md`.** If one already exists for a PRD
   and still matches it, that PRD has been expanded; say so and leave it alone.
   Rewrite an existing expansion only when the original has since changed.
3. **`.agents/skill-instantiation.json`** — the profile (language, backend,
   frontend, deploy target). This tells you which defaults are already decided
   by the scaffold, so you do not restate or contradict them.

## Judge first, and say what you found

For each original PRD, check it against this bar, clause by clause. Report your
finding for each one — present, absent, or not applicable to this product:

- **Problem.** What is wrong or missing today, for whom.
- **Primary user.** Who uses this. One named kind of person is enough.
- **Primary user flow.** The one path through the product that matters most,
  start to finish.
- **Testable acceptance criteria.** Statements a test can pass or fail. "Works
  well" is not one; "`GET /:code` returns 302 to the stored URL" is.
- **Explicit non-goals.** What this product deliberately does not do.
- **The surfaces that matter, where they matter.** Key data records, external
  integrations, authentication expectations, and the deployment target — each
  only when this product actually has one.
- **Definition of done for the running product.** What must be true of the live
  thing, e.g. the URL loads and the primary flow completes.

**If every applicable clause is present, write nothing.** Report that the PRD is
workable as-is, with the clause-by-clause finding as your evidence, and stop.
Adding an expansion to a PRD that does not need one buys nothing and costs a
file every later reader must reconcile.

## If it does not meet the bar: write the expansion

Write `docs/prd/<original-basename>.expanded.md` — the original's own name with
`.expanded` before the extension, in the same directory. One expansion per
original.

**Never edit, reword, reorder, or delete the original.** It is the human's
statement of what they asked for, and it stays exactly as they wrote it. Your
file is a derived sibling; the pair is one product.

The expansion opens with this header, filled in:

```markdown
# PRD (expanded): <product name>

> **This file is derived.** It expands `<original filename>`, which is
> unedited and remains authoritative for intent and scope. Everything here that
> the original did not state is marked `(assumption)` and may be struck by a
> human without argument. Where this file and the original disagree, the
> original is right and this file has a defect.
>
> Expanded because: <the clauses that were missing, in one sentence>.
```

Then the complete PRD: `## Problem`, `## Users`, `## Primary Flow`,
`## Requirements`, `## Non-Goals`, `## Acceptance Criteria`, and — only where
the product has them — `## Data`, `## Integrations`, `## Authentication`,
`## Deployment`. Carry every statement of the original through verbatim or
with its meaning intact; fill the rest.

End with two sections:

- `## Assumptions Added` — every `(assumption)` item, listed once, each with the
  one-line reason it is the common-sense reading of what was asked.
- `## Open Questions` — anything you could not complete without making a
  decision that is expensive, irreversible, or genuinely the human's to make.
  A question here is the correct output; a confidently invented answer is not.

## The line you must not cross

You are completing a description, not growing a product. Everything you add must
be something a reasonable person would say was *implied by what was already
asked for*, and would be surprised to find missing.

Add: the acceptance criteria implied by the stated feature; the obvious error
and empty states of the stated flow; the data the stated feature must persist;
the non-goals that follow from the stated scope; the definition of a working
deployed instance.

Never add: research or market analysis; a roadmap, milestones, or phases;
pricing, business model, or sales motion; user accounts, teams, permissions,
billing, analytics, notifications, admin panels, or an API — unless the original
asked for them; a second product surface; a "future work" section; scale,
performance, or availability targets nobody stated.

When you are unsure whether something is completion or expansion, it is
expansion. Put it in `## Open Questions` instead.

Two concrete cases, so the line is not abstract:

- *"Build a hello world web app."* → Completion is: a page that renders a
  greeting, served over HTTP, reachable at a URL, with a health endpoint and one
  test proving the page responds. **Not**: a visitor counter, a theme switcher,
  a deploy pipeline the original never mentioned.
- *"Make a link shortener."* → Completion is: create a short code for a URL,
  redirect it, persist the mapping, reject a malformed URL, and the behavior
  when a code does not exist. **Not**: custom domains, expiry policies, click
  analytics, accounts, or an admin dashboard.

## Before you finish — verify your own output

1. The original file is byte-for-byte unchanged. Check it.
2. Every statement in the original appears in the expansion, none narrowed or
   dropped.
3. Every item the original did not state carries `(assumption)`, and each one
   appears in `## Assumptions Added`.
4. Every acceptance criterion is something a test could pass or fail.
5. Nothing you added is on the "never add" list above.
6. The header names the original file, exactly.

End by printing: which PRDs you judged, the clause-by-clause finding for each,
whether you wrote an expansion and why, how many assumptions it added, and every
open question you recorded. If you wrote nothing, say that plainly — "workable
as-is" is a successful outcome of this step, not a failure to do the work.
