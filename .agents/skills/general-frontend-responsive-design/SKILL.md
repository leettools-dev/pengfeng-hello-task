---
name: general-frontend-responsive-design
description: "Adapt frontend UI and workflows across screen sizes, devices, input modes, zoom levels, orientation changes, and embedded contexts. Use when asked to make a page responsive, mobile-friendly, tablet-ready, touch-safe, keyboard-friendly, high-zoom-safe, or robust across viewport sizes."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Responsive Frontend Design

Make the same workflow usable across contexts without changing the underlying
product model.

Read `general-frontend-design` first. Use `general-frontend-verify` for browser
checks when layout, routing, forms, or interactions change.

## Target Contexts

Check at least:

- Narrow mobile viewport.
- Typical laptop viewport.
- Wide desktop viewport.
- 200 percent zoom where practical.
- Keyboard-only navigation.
- Touch target sizing for primary mobile actions.
- Reduced motion preference when motion is present.
- Embedded or constrained containers when the product supports them.

## Layout Rules

- Keep primary actions near the content they affect.
- Use side-by-side comparison only when both sides remain readable; otherwise
  stack with clear context and preserved action access.
- Long rows, cards, tables, names, comments, and code-like strings need
  wrapping, truncation, progressive disclosure, or horizontal scroll on the
  right container instead of page-level overflow.
- Toolbars, counters, badges, tabs, and icon buttons need stable dimensions to
  avoid layout shift.
- Dialogs must fit narrow screens and keep consequence text and primary actions
  visible.
- Do not hide critical state or required actions only behind hover affordances.

## Implementation Rules

- Prefer CSS grid, flex, container queries, and responsive constraints over
  duplicated markup.
- Use `min-width: 0`, `overflow-wrap`, `aspect-ratio`, `max-width`, and stable
  control sizing where needed.
- Keep keyboard order aligned with visual order after responsive changes.
- Use icon-only controls only when an accessible label and tooltip or nearby
  context make the action clear.
- Do not shrink text below readable sizes to solve layout problems.
- Respect safe areas and avoid fixed overlays that trap content behind browser
  chrome on mobile.

## Verification

Use Playwright or browser screenshots at representative widths. Check console
errors, failed API calls, focus visibility, text overlap, horizontal page
overflow, touch target size, and whether the primary workflow remains complete.
