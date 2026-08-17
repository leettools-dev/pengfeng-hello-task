---
name: general-testing-strategies
description: "Design a risk-based test strategy across static, unit, component, integration, contract, end-to-end, performance, accessibility, and security layers. Use when planning project quality gates, choosing test levels, reviewing coverage, or mapping acceptance criteria to evidence."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Testing Strategies

Read [the canonical testing strategy](references/testing-strategy.md).
For TypeScript implementation details, use
`testing-typescript-applications`. For browser suites, use
`testing-with-playwright`.

## Process

1. List observable behaviors and acceptance criteria.
2. Rank failure impact and likelihood.
3. Identify the boundaries each behavior crosses.
4. Select the cheapest test level that exercises the real failure mode.
5. Define deterministic data, identity, time, network, and cleanup controls.
6. Map every criterion and high-risk negative path to evidence.
7. Define local, pull-request, main-branch, and scheduled CI suites.

Use [the test-plan template](assets/test-plan.md) for the output.

## Rules

- Do not prescribe fixed unit/integration/E2E percentages.
- Do not treat a coverage target as proof of correctness.
- Prefer behavior assertions over implementation details.
- Test production-specific persistence behavior against the real engine.
- Keep browser tests focused on flows that need a real browser boundary.
- Require regression tests for defects and negative tests for security policy.
- Treat flaky tests as defects with an owner and deadline.

## Review Questions

- Could this test pass while the user-visible behavior is broken?
- Is the test at a more expensive level than necessary?
- Is a mock hiding the boundary most likely to fail?
- Can it run independently, in parallel, and in any order?
- Does the plan include authorization, error, and boundary cases?
- Is any required evidence still manual, and is the reason explicit?
