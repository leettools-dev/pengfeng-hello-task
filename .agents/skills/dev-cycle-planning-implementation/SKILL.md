---
name: dev-cycle-planning-implementation
description: "Turn approved scope into an implementation plan at docs/plans/<feature>.md — affected files, architecture decisions, a test plan, and ordered tasks each with an exact path and a verification command."
layer: lifecycle
peers:
  - general-testing-strategies
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Planning an Implementation

## Overview

This skill produces one artifact: `docs/plans/<feature>.md`, the ordered task
list that implementation follows. Its value is not the idea of planning — it is
that the plan lands at a known path, in a fixed shape, so that whoever
implements (and whoever reviews) can find it and check work against it.

Use it when a change spans more than one file or carries a decision worth
recording. Skip it for a single-function fix.

Inputs: the PRD in `docs/prd/`, and `docs/dev-spec.md` when one exists — the
plan must follow the spec's stack selections and Specification rules rather
than re-deciding them.

## The Plan File

Write `docs/plans/<feature>.md` with these four sections. Omit none; an empty
section is itself information.

### 1. Affected Files

Read the existing code before listing anything. Name each file as create or
modify, and note the established pattern the change should follow — a plan that
introduces a second way to do something the repo already does is a defect.

### 2. Architecture Decisions

One paragraph each, only for decisions that constrain later work:

```
### Decision: <what was decided>
- Context: <why a decision was needed>
- Chosen: <option> because <reason>
- Consequences: <what this forecloses or requires>
```

When `docs/dev-spec.md` exists, decisions that change a spec rule go in the
spec's Change Log too. The plan does not silently override the spec.

### 3. Test Plan

Map each acceptance criterion and high-risk failure path to the evidence that
will prove it, using [the test-plan template](../general-testing-strategies/assets/test-plan.md):

| Criterion / risk | Test level | File or command | Expected evidence |
|------------------|------------|-----------------|-------------------|

Pick the lowest-cost level that exercises the real failure mode. Record test
data, identity/role fixtures, time and randomness controls, cleanup, and
parallel-execution assumptions when they apply.

### 4. Tasks

Each task carries a description, exact paths, and a command whose output
settles whether the task is done:

```
### Task 1: Add the document-search route schema
- Files: src/routes/documents/search.schema.ts (create)
- Verify: npm run check — TypeBox schema compiles and exports

### Task 2: Add search() to DocumentStore
- Files: src/stores/document-store.ts (modify), tests/unit/document-store.test.ts (create)
- Verify: npm test -- document-store — matching and non-matching queries pass

### Task 3: Register GET /api/v1/documents/search
- Files: src/routes/documents/index.ts (modify)
- Verify: npm test -- routes/documents — returns 200 with the expected body

### Task 4: Regenerate the typed client
- Files: src/generated/api-client.ts (regenerate)
- Verify: npm run generate:client && npm run check — no drift, no type errors
```

Sizing rules: a task touching more than three files is too big; a task without
a verification command is not a task; order by dependency.

## Definition of Done

- [ ] `docs/plans/<feature>.md` exists with all four sections
- [ ] Every task names exact paths and a verification command
- [ ] Every acceptance criterion appears in the test plan
- [ ] Plan follows `docs/dev-spec.md` stack and Specification rules, or records the deviation as a Decision
- [ ] Existing patterns identified and reused rather than duplicated

## Anti-Patterns

- **Verification by assertion.** "Verify: the endpoint works" is not evidence. Name the command and what its output must show.
- **Planning to the line.** The plan says what and where, not every statement. Leave judgment to implementation.
- **Re-deciding the stack.** The dev spec already fixed it. A plan that reopens it is a spec change, and belongs in the spec.
- **Unread codebase.** Listing files without reading them produces plans that fight the existing structure.
