---
name: general-diagramming-architecture
description: "Produce a system architecture diagram as a committed SVG emitted by a checked-in generator program — components declared as data, edges typed by meaning, deterministic bytes, and a --check gate that fails when the picture drifts. Use when a design needs to show who owns which decision and what each component is reachable through."
layer: lifecycle
peers:
  - general-reviewing-design-with-aposd
  - dev-cycle-writing-dev-specs
  - general-designing-apis
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Diagramming System Architecture

## Overview

A system architecture diagram earns its place only when it answers something
prose answers badly: **which component owns which decision, and what is each
one reachable through**. A picture of boxes named after directories answers
neither, and rots without anyone noticing.

This skill produces that diagram as an SVG emitted by a generator program
committed beside it. The policy — what the diagram must encode, the layout and
typography budgets, the edge vocabulary, and the failure modes that make
generated diagrams break — is canonical in
[architecture-diagrams](references/architecture-diagrams.md).
[`render-architecture-svg.ts`](scripts/render-architecture-svg.ts) is a
dependency-free starting point: copy it into the repository, replace the
example declarations with real ones, run it. Running it unchanged produces
[`architecture.svg`](scripts/architecture.svg), a three-band example that
exercises every primitive — tabs, badged cards, typed edges, gutter routing,
and the build-time fit assertion.

Use this skill when:
- A design document describes components whose *boundary* is the point — who
  decides, who executes, who merely observes
- A reader has to hold four or more collaborating components in their head to
  follow the document
- An interface surface (routes, contracts, mounts) needs to be visible next to
  the components that serve it

## Choose the Format First

Generating an SVG is the expensive option. Take it only when the cheap one
cannot carry the content.

| Situation | Use |
|---|---|
| Sequence, state machine, ER diagram, linear flow, under ~15 nodes | Mermaid fenced in the Markdown — no generator, no committed image |
| Ownership boundaries across layers, per-component responsibilities, and an interface surface in one view | a generated SVG (this skill) |
| A sketch nobody will maintain | do not commit it |

Never commit a hand-drawn binary or a screenshot of a whiteboard. It cannot be
diffed, a typo cannot be fixed, and no gate can tell that it went stale.

## Procedure

1. **Write the question the diagram answers** in one sentence, and put it in the
   subtitle. If the sentence is "here are the components", stop — that is a
   file tree, not an architecture.
2. **Extract components from the design document, not the directory listing.**
   A component is anything that owns a decision or a boundary. Give each one a
   role line and its responsibilities, in the document's own words.
3. **Band by ownership, not by call order.** Each band is one party that could
   be swapped for another. Cross-band edges are the interfaces; that is the
   whole payload of the diagram.
4. **Declare, do not draw.** Components are data — position, title, lines,
   accent, badge — rendered by shared primitives. A literal SVG string that has
   to be hand-edited to change a label will not survive its second revision.
5. **Type every edge by meaning** (control, execution, data, filesystem,
   best-effort) and give the diagram a legend. Color carries meaning or is
   removed.
6. **Fit-check at build time.** SVG does not measure text, so the generator
   must assert that every line fits its box. See
   [the fit budget](references/architecture-diagrams.md#typography-and-the-fit-budget).
7. **Render it and look at it.** Rasterize (`rsvg-convert`, `resvg`) and inspect
   the image. Reviewing SVG source catches none of the collisions.
8. **Gate it.** Commit the generator and the SVG; run the generator's `--check`
   in CI so a design change cannot land with a stale picture.

## Attention Items

The failure modes are specific and mostly non-obvious. The full table with the
rule for each is in
[Failure Modes](references/architecture-diagrams.md#failure-modes); the four
that bite first:

- **Non-determinism** — iterating a hash-ordered set, or stamping a timestamp,
  makes `--check` fail immediately after a successful write.
- **Collapsed whitespace** — XML folds runs of spaces, so space-padded columns
  render ragged. Use two text elements at fixed x.
- **Text overflow** — nothing clips or wraps for you; a long line simply leaves
  its box.
- **Label and edge collisions** — a band title spanning the full width will be
  crossed by the first vertical edge that enters that band.

## Verification

- The rendered raster was viewed, not just generated.
- Running the generator twice produces identical bytes, and `--check` passes
  against the committed file.
- Every component's role line comes from the design document, and the document
  links to the diagram.
- Removing the legend would make an edge ambiguous — if not, the edge typing is
  decorative and should go.
- A reader who has not read the design document can say who owns the plan, who
  executes it, and what the boundary between them is.

## Checklist

- [ ] Format chosen deliberately; Mermaid rejected for a stated reason
- [ ] Subtitle states the question the diagram answers
- [ ] Components carry a role and responsibilities, sourced from the document
- [ ] Bands are ownership boundaries, not call-order stages
- [ ] Components declared as data and rendered by shared primitives
- [ ] Edges typed by meaning, with a legend
- [ ] Build-time fit assertion on every text line
- [ ] Output deterministic; `--check` wired into CI
- [ ] Rasterized and visually inspected before commit
- [ ] Source document links to the diagram; the SVG names its generator
