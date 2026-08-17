---
description_append: Apply this product's own specification rules, toolchain, and release obligations when writing or updating the dev spec.
---

## Product-Specific Dev Spec Rules

Replace the examples below with rules that are true for this product. They are
appended to the generic skill, so state only what is specific here.

- Record deviations from the default stack as Architecture Decisions in
  `docs/dev-spec.md`, including the reason and what the choice forecloses.
- When deployment, DNS, certificates, or environment wiring is in scope, the
  spec must name the sibling utility repo that owns it and the preflight
  command that proves it works — see `.agents/toolchain.json`.
- User-visible behavior requires a GTM obligation in the spec: which of
  `gtm/documentation/`, `gtm/marketing/`, or `gtm/sales/` must be updated.
- Treat `.agents/skills/` as generated output. Change this overlay or a utility
  repo fragment instead of editing an installed skill.
