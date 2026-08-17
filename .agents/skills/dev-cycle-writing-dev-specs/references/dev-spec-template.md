# Dev Spec Template

Copy this template to `<project>/docs/dev-spec.md`. This file is the enforceable
project contract; keep diagrams, component narratives, and explanatory data
flow in `<project>/design/architecture.md`, which must link back here. Replace
the bracketed placeholders. Label every rule `[Specification]` or `[Guidance]`
and give it a compliance degree (`must-have`, `should-have`, `nice-to-have`).
Delete sections that genuinely do not apply (e.g. frontend sections for a
headless service) — note the deletion in the Change Log.

```markdown
# <Project Name> — Engineering Dev Spec

- PRD: <link or path>
- Architecture narrative: ../design/architecture.md
- Status: draft | approved | in-implementation | shipped
- Last updated: <YYYY-MM-DD>

## 1. System Overview

<2–4 paragraphs: what the system does, the app type (web app /
local single-user app / service / CLI), major components, and how
they communicate. Include a component diagram if more than two
components.>

## 2. Architecture Decisions

<One entry per deviation from the stack defaults, or per significant
structural choice.>

### Decision: <what was decided>
- Context: <why a decision was needed>
- Options considered: <A, B, C>
- Chosen: <A> because <reason>
- Consequences: <what follows>

## 3. Backend Spec

<Fill from backend-spec-checklist.md. Every item: rule text,
[Specification|Guidance], compliance degree.>

### 3.1 Engineering Foundation
### 3.2 Code Structure
### 3.3 Runtime Patterns
### 3.4 Data Policies
### 3.5 Security Policies
### 3.6 DevOps Policies

## 4. Frontend Spec

<Fill from frontend-spec-checklist.md.>

### 4.1 Foundation
### 4.2 Structure and State
### 4.3 UI Standards
### 4.4 Quality Gates

## 5. Identity and Access

### 5.1 Clients and Authentication

<For every web, VS Code, mobile, CLI, and service client: identity
provider, protocol/flow, session or token transport, expiration,
rotation, revocation, logout, recovery, reauthentication, MFA,
CSRF, rate limits, and audit events. Use
docs/security/authentication.md.>

### 5.2 Authorization and Tenancy

<Link or include the authorization matrix. Define principals, tenant
scope, permissions, role bundles, ownership/relationship rules,
enforcement points, repository constraints, 403/404 policy, support
impersonation, and audit events. Use docs/security/authorization.md
and templates/authorization-matrix.md.>

### 5.3 Threat Model

<Required for external users, sensitive data, federated identity, or
multi-tenant systems. Link templates/threat-model.md.>

## 6. API Contract

<Endpoint list with methods, request/response shapes, and error
model. Identify the runtime schema source, OpenAPI generation, client
generation, compatibility policy, and contract checks. Reference
general-designing-apis and docs/architecture/api-contracts.md.>

## 7. Data Model

<Entities, key fields, relationships, retention/deletion policy, and
migration approach. Define tenant keys and isolation constraints where
applicable. Choose soft delete, archival, or hard delete per entity
from retention, recovery, and erasure requirements.>

## 8. Test Strategy

<Link or include templates/test-plan.md. Map acceptance criteria and
high-risk negative paths to static, unit/component, API/integration,
contract, browser, security, performance, accessibility, or manual
evidence. Define test data, identity fixtures, isolation, CI tiers,
and residual risks. List every port with more than one adapter. Run its
shared contract suite against each adapter; for durable adapters, use the
production database engine (or a faithful embedded distribution) with real
migrations and constraints, not only an in-memory fake. Record any production
semantics that still require a separate test tier.>

## Progress Log

<Append one entry per milestone during implementation. Newest first.>

- <YYYY-MM-DD> — <milestone reached, what is working, what is next>

## Change Log

<Append one entry whenever a spec decision changes after approval.
Newest first.>

- <YYYY-MM-DD> — <what changed, why, sections affected>
```

## Maintenance Rules

- The implementing agent **must** update the Progress Log when completing a milestone or ending a work session, and the Change Log whenever implementation diverges from the spec. [Specification, must-have]
- A spec change during implementation is allowed, but the Change Log entry must say why — silent divergence is not. [Specification, must-have]
- Keep entries to one or two lines; this is a log, not a journal. [Guidance]
