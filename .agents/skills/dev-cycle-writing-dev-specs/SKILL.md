---
name: dev-cycle-writing-dev-specs
description: "Turn a PRD or hybrid product/design brief into an enforceable engineering dev spec by reviewing product intent, preserving prior design decisions, asking clarifying questions, and applying the preferred stack and spec checklists. Apply this product's own specification rules, toolchain, and release obligations when writing or updating the dev spec."
layer: lifecycle
peers:
  - general-designing-apis
  - general-testing-strategies
  - security-designing-authentication
  - security-designing-authorization
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Writing Dev Specs from a PRD

## Overview

Use this skill when you are given a PRD (product requirements document), or a
hybrid product/design brief, and need to produce the engineering **dev spec**.
The dev spec is the enforceable contract between product intent and code: it
fixes the stack, structure, and policies before task planning starts. The
system-design narrative lives separately in `design/architecture.md` and links
to the contract.

The input is a PRD in `docs/prd/`. If none exists, write one first — a dev spec
built on an unwritten PRD encodes assumptions instead of requirements.

**When a `<name>.expanded.md` sits beside a `<name>.md`, they are one product.**
The original is the human's own statement, authoritative for intent and scope,
and nothing you do edits it. The expansion is its derived completion and holds
the acceptance criteria; items in it marked `(assumption)` were added to make an
otherwise thin PRD buildable, so they are the first things to confirm in your
clarification round. Where the two disagree, the original wins.

## Process

### Step 1: Review the PRD

Read the full PRD before writing anything. Check that it answers:

- Who are the users and what are the core user flows?
- What data is created, read, and retained? Single-user or multi-user?
- Is this a web app (browser–server), a local single-user app, a service, or a CLI?
- What are the explicit non-goals?
- Are there performance, compliance, or integration constraints?
- What clients exist now or are expected later (web, VS Code, mobile, service)?
- What trust boundaries and sensitive operations exist?

If the input already contains component choices, data flow, build order, or
other design-level decisions, treat it as a hybrid product/design brief:

1. Extract the user problem, goals, flows, requirements, acceptance criteria,
   and non-goals into `docs/prd/`; do not leave product intent only in an
   architecture document.
2. Inventory the existing design decisions. Carry compatible decisions into
   the dev spec as pre-recorded Architecture Decisions, including their stated
   rationale; do not silently re-derive or discard them.
3. Flag contradictions with the product requirements, stack defaults, or
   security policy during clarification. A prior design decision is input, not
   permission to bypass required controls.

### Step 2: Request Clarification

If any answer above is missing or ambiguous, **stop and ask the user** before proceeding. Batch the questions into one round. Do not guess on:

- Single-user vs. multi-user (changes the storage choice — see stack defaults)
- Deployment target (local machine vs. server)
- Authentication requirements and client types
- Authorization roles, ownership rules, and administrative/support access
- Single-tenant vs. multi-tenant isolation model
- Data volume and retention expectations

If the PRD is complete, say so and continue.

### Step 3: Update the PRD and Preserve Design Input

Append a `## Technical Notes` section to the PRD (do not rewrite product
content) recording — **to the expansion when one exists, never to the
original**:

- The selected stack (from the defaults below, plus any PRD-driven deviations)
- External integrations and their auth model
- Data entities at a high level
- Anything the clarification round changed

For a hybrid input, keep the extracted PRD product-focused. Put enforceable
rules and pre-recorded decisions in `docs/dev-spec.md`, and put diagrams,
component responsibilities, and explanatory data flows in
`design/architecture.md`.

### Step 4: Apply the Preferred Stack

Unless the PRD forces a deviation, the stack is **not an open decision** — use these defaults:

| Concern | Default | Notes |
|---------|---------|-------|
| Web / browser–server apps | TypeScript on both frontend and backend | |
| Backend framework | Fastify (TypeScript, Node runtime) | See `backend-typescript-building-fastify-services`. Hono is the sanctioned alternative only when edge/serverless deployment is a hard requirement |
| Frontend framework | React 19 + Vite (TypeScript) | See `frontend-typescript-building-react-frontends`. Default because it keeps TypeScript on both ends and ports to VS Code webviews and React Native. Vue 3 is the backup (`frontend-typescript-building-vue-frontends`) when a project chooses it — record as an Architecture Decision |
| Package manager | npm | We standardize on npm (with npm workspaces for monorepos); not Bun |
| Storage | Postgres for every program | Local via Docker Compose; `pgvector` for vector search; no second engine — see `general-instrumenting-product-analytics` |
| API contract | TypeBox routes → OpenAPI → generated TypeScript client/types | See `general-designing-apis` |
| Python | Only when the app specifically needs it (ML, library compatibility) | Then follow the `python-*` skills, starting with `python-building-fastapi-services` |

Record every deviation from a default as an explicit Architecture Decision in the spec, with the reason.

### Step 5: Write the Dev Spec

Create `docs/dev-spec.md` from
[references/dev-spec-template.md](references/dev-spec-template.md). Fill every
checklist item using:

- [references/backend-spec-checklist.md](references/backend-spec-checklist.md) — backend sections 1–6
- [references/frontend-spec-checklist.md](references/frontend-spec-checklist.md) — frontend sections
- [authentication.md](../security-designing-authentication/references/authentication.md) — authentication decisions
- [authorization.md](../security-designing-authorization/references/authorization.md) — authorization and tenant boundaries
- [testing-strategy.md](../general-testing-strategies/references/testing-strategy.md) — risk-based test evidence
- [api-contracts.md](../general-designing-apis/references/api-contracts.md) — shared contract pipeline

Every item in the spec is labeled with its rule type and compliance degree (next section). The spec must include **Progress Log** and **Change Log** sections — these are maintained throughout implementation, not just at spec time.

Create or update `design/architecture.md` as the system-design narrative. It
may contain diagrams, component responsibilities, deployment topology, and
data flow, but it must link to `docs/dev-spec.md` for enforceable rules rather
than duplicating them. A concise architecture document whose primary purpose is
to orient readers and link to a complete dev spec is valid.

### Step 6: Keep the Spec Live During Implementation

The spec is not finished when implementation starts. Whoever implements against
it updates the **Progress Log** at each milestone and the **Change Log**
whenever a spec decision changes. A spec that stops moving while the code moves
has stopped being the contract.

## Specification vs. Guidance

Every rule in the dev spec is one of:

**Specification** — a concrete, enforceable standard for this project. It answers: "What must we use or follow?" Use it when inconsistent implementation would hurt maintainability, correctness, security, or operations. Wording: *must, must not, required, selected library, standard pattern*.

**Guidance** — a recommended practice or design principle. It answers: "How should we think about this when there is no strict rule?" Use it when the topic depends on context and reasonable exceptions are expected. Wording: *should, prefer, avoid, recommended, consider*.

## Compliance Degrees

Each checklist item also carries a compliance degree:

- **must-have** — the spec is incomplete without it; implementation cannot ship without it
- **should-have** — required unless the spec documents a reason to skip
- **nice-to-have** — include when the project size justifies it

The checklists in `references/` carry default degrees; tighten them for larger projects, never loosen a must-have.

## Anti-Patterns

- **Guessing instead of asking.** A spec built on assumed answers to Step 2 questions will be rewritten. Ask once, early.
- **Re-debating the stack.** The defaults exist so agents produce consistent systems. Deviate only with a recorded Architecture Decision.
- **Spec without rule labels.** An unlabeled rule is unenforceable — reviewers can't tell a hard requirement from a preference.
- **Write-once specs.** A spec without an updated Progress Log and Change Log is stale by the second milestone.

## Checklist

- [ ] PRD reviewed against the Step 1 questions, including any `(assumption)` items in its expansion
- [ ] Original PRD left unedited; technical notes appended to the expansion where one exists
- [ ] Hybrid input split into product intent and preserved design decisions, when applicable
- [ ] Clarifications requested (or PRD confirmed complete)
- [ ] PRD updated with `Technical Notes`
- [ ] Stack selected from defaults; deviations recorded as Architecture Decisions
- [ ] All backend checklist sections filled with [Specification|Guidance] + compliance degree
- [ ] All frontend checklist sections filled with [Specification|Guidance] + compliance degree
- [ ] Authentication model complete for every client type
- [ ] Authorization matrix, tenant scope, and enforcement points documented
- [ ] API contract source and generated-client path documented
- [ ] Acceptance criteria and high-risk failures mapped to test evidence
- [ ] Progress Log and Change Log sections present
- [ ] `design/architecture.md` explains the system and links to `docs/dev-spec.md`

## Product-Specific Instructions

<!-- Source: .agents/skill-overlays/dev-cycle-writing-dev-specs.md -->

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
