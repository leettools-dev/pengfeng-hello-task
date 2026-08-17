---
name: testing-typescript-applications
description: "Design, implement, and review TypeScript test suites using Vitest, Testing Library, MSW, Fastify injection, real database integration, contract checks, and Playwright. Use when planning tests, adding regression coverage, configuring TypeScript testing, or deciding the correct test level for frontend, backend, or shared packages."
layer: lifecycle
applies_when:
  language: [typescript]
peers:
  - general-designing-apis
  - general-testing-strategies
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Testing TypeScript Applications

Read [the TypeScript testing guide](references/typescript-testing.md)
and [the testing strategy](../general-testing-strategies/references/testing-strategy.md) before
selecting tools or coverage.

## Process

1. Identify observable behavior, failure consequences, and boundaries crossed.
2. Inspect existing test conventions and scripts before adding a new pattern.
3. Select the lowest-cost test level that reproduces the real failure mode.
4. Define test data, identity, time, randomness, network, and cleanup controls.
5. Implement positive, negative, boundary, and regression cases proportional
   to risk.
6. Run focused tests first, then the affected package suite and required CI
   checks.
7. Report commands, results, and any untested residual risk.

Use [the test-plan template](../general-testing-strategies/assets/test-plan.md) for feature-sized
work.

## Required Defaults

- Use Vitest for TypeScript unit, component, API, and integration suites.
- Use Testing Library and `user-event` for React behavior.
- Use MSW at the network boundary rather than mocking the API client.
- Use Fastify `app.inject()` for route behavior.
- Run a shared behavior contract against every implementation of a port. Test
  durable adapters with real migrations, constraints, and engine semantics;
  an in-memory fake alone is insufficient. PGlite is suitable for compatible
  Postgres semantics, while concurrency/extensions require disposable Postgres.
- Generate frontend transport types from the backend OpenAPI contract.
- Keep Playwright for critical browser journeys; use
  `testing-with-playwright` for browser suite design.

## Review Standard

Reject tests that assert private implementation details, depend on execution
order, share mutable state across parallel workers, or substitute an in-memory
database for production-specific SQL behavior. Do not add tests solely to
reach a percentage.
