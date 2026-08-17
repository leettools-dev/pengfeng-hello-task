---
name: general-reviewing-design-with-aposd
description: "Review code, APIs, modules, diffs, and refactors for APOSD design problems such as shallow modules, information leakage, temporal decomposition, overexposure, and pass-through layers."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# APOSD Review

## Overview

Use APOSD as a complexity-reduction check. The standard is whether the design makes the whole system easier to understand and change.

Prefer findings over summaries. Only report APOSD issues that materially increase caller burden, change amplification, or hidden coupling. If the code is clean by these standards, say so explicitly.

Use this guide when:
- Reviewing a PR, diff, module, or service boundary
- Deciding whether to add, keep, split, or delete an abstraction
- Refactoring churn-heavy or bug-prone code
- Evaluating public APIs, helper layers, context objects, or naming
- Checking whether a patch fixes the root problem or only extends a fragile design

## Review Flow

1. Identify each touched module's real responsibility.
2. Identify which knowledge each module should own privately.
3. Check whether sequencing is hidden inside an owner or pushed onto callers.
4. Check whether interfaces are getting deeper and simpler, or wider and noisier.
5. Check whether special cases, duplicated rules, or pass-through layers are accumulating.
6. Report only the highest-signal red flags with concrete evidence and a refactor direction.

## Default Questions

Ask these before approving a design or adding code:

1. Does this reduce system-wide complexity?
2. Does it hide complexity or just move it?
3. Does it localize knowledge?
4. Does it force callers to know internals or call order?
5. Does it add a forwarding layer or pass-through variable?
6. Does it duplicate policy or leak private conventions?
7. Does it mix general infrastructure with one-off behavior?
8. Does it fit adjacent interface conventions?
9. Is the naming crisp, singular, and easy?
10. Is this patch masking a deeper design problem?

## High-Signal Red Flags

Start with these checks:

- `Shallow Module`: Interface cost is high relative to what it hides.
- `Information Leakage`: Private conventions or schema details are duplicated outside the owner.
- `Temporal Decomposition`: API design forces callers to manage sequencing.
- `Overexposure`: Public APIs expose internal knobs, storage details, or transport details.
- `Pass-Through Method`: A layer forwards calls without adding policy, validation, or simplification.
- `Pass-Through Variable`: Context is threaded through layers that do not conceptually own it.
- `Conjunctions in Names`: Names like `parse_and_validate` often reveal mixed responsibility.
- `Inconsistent Interface`: Adjacent APIs differ in naming, argument order, return shape, or error behavior without reason.
- `Code Duplication`: Repeated rules or invariants create drift risk.
- `Special-General Mix`: Shared infrastructure contains one-off feature logic.
- `Unusually Many Errors`: Churn-heavy code often signals a design problem, not just missing guards.
- `Hard to Pick a Name`: Naming difficulty usually means the abstraction is muddled.

For heuristics, examples, and default refactors, read [references/aposd-red-flags.md](references/aposd-red-flags.md).

## Preferred Refactors

When a red flag is real, prefer:

- deepen the module
- merge or delete useless layers
- move private knowledge to one owner
- hide sequencing inside one abstraction
- standardize similar interfaces
- extract shared policy and invariants
- move one-off behavior out of general mechanisms
- redesign churn-heavy code instead of stacking patches
- split mixed concepts until naming becomes easy

## Review Output

When writing review feedback, use this structure:

### Red Flag

`<name>`

### Why It Matters

`<1-3 sentence explanation tied to complexity or change amplification>`

### Evidence

- `<file / API / naming / call pattern>`
- `<what callers now need to know>`

### Recommended Change

`<refactor direction>`

### Expected Benefit

`<how this reduces system complexity>`

## Guardrails

- Do not report style nitpicks as APOSD findings.
- Do not demand refactors when the added abstraction clearly hides meaningful complexity.
- Do not split responsibilities mechanically; a higher-level operation is fine when it owns a real lifecycle or policy.
- Prefer concrete evidence from the actual code over generic architecture advice.
- If there are no meaningful APOSD issues, say so directly.
