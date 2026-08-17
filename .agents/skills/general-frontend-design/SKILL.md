---
name: general-frontend-design
description: "Design and implement polished application UI across frontend stacks. Use when building or changing pages, components, layouts, visual styling, design-system alignment, interface polish, calmer professional UI, or product-focused frontend UX."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Frontend Design

Build the actual usable interface, not a decorative shell around it. Let the
domain, user job, risk level, and data shape drive the layout and visual tone.

Use the stack skill for framework-specific implementation:
`frontend-typescript-building-react-frontends` or
`frontend-typescript-building-vue-frontends`. Use `general-frontend-verify` for
browser checks when layout, routing, forms, or interactions change.

## Start With Product Shape

Identify before designing:

- Primary user job and the next action the screen must support.
- Risk level: destructive action, public visibility, payment, identity,
  privacy, permissions, or low-risk browsing.
- State model: loading, empty, partial, success, validation error, permission
  error, conflict, offline, and unexpected failure.
- Data density: scan-heavy table, editor, dashboard, form, comparison,
  timeline, or media view.
- Existing design system: tokens, components, spacing, themes, icons, and copy
  vocabulary already in the app.

## UI Principles

- Make the first screen useful. For apps and tools, show the working experience
  rather than a marketing landing page unless the product explicitly needs one.
- Match the visual tone to the domain. Operational tools should be quiet,
  dense, scannable, and repeatable; consumer, editorial, or game interfaces may
  be more expressive when that serves the job.
- Keep hierarchy clear with layout, grouping, type scale, and spacing before
  adding color or decoration.
- Use semantic color for state: danger, warning, success, info, selected,
  disabled, privacy, or destructive. Do not rely on color alone.
- Keep cards for repeated items, dialogs, and focused tools. Avoid nested cards
  and floating-card page sections.
- Use stable dimensions for toolbars, icon buttons, counters, tabs, badges,
  grids, and fixed-format surfaces so dynamic content cannot shift the layout.
- Use existing components and CSS variables before adding one-off styles.
- Ensure every interactive control has visible hover, focus, active, disabled,
  selected, loading, and error states where relevant.
- Keep text readable and contained at desktop, mobile, and high zoom. Do not
  solve overflow by shrinking text below readable sizes.

## Normalize And Polish

When improving an existing interface:

1. Normalize divergent components, token usage, spacing, typography, theme
   behavior, and interaction states to the app's local system.
2. Remove visual noise that competes with the user's work: ornamental shadows,
   decorative gradients, heavy glow/blur, unnecessary motion, oversized panel
   headings, and duplicated framing.
3. Polish alignment, spacing rhythm, section boundaries, label clarity, empty
   states, disabled/loading states, and long-text behavior.
4. Preserve risk clarity. Calmer UI must not make destructive, privacy, auth,
   payment, or permission states ambiguous.

## Verification

For visible changes, inspect the affected routes in a browser at representative
desktop and mobile widths. Check focus visibility, long text, empty/error
states, and console/network failures. Use Playwright evidence through
`general-frontend-verify` when the change affects behavior or layout.
