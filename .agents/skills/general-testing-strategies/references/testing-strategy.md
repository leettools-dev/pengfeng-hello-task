# Testing Strategy

Testing exists to reduce the risk of shipping incorrect behavior. Test counts,
pyramid percentages, and coverage percentages are indicators, not objectives.

## Select Tests by Risk and Boundary

For each change, identify:

1. The user-visible or externally observable behavior.
2. The business or security consequence if it is wrong.
3. The boundaries crossed: function, component, HTTP, database, process, or
   browser.
4. The cheapest test level that exercises the real failure mode.

Use the following default layers:

| Layer | Best for |
|------|----------|
| Static checks | Type contracts, unreachable states, lint rules, generated-code drift |
| Unit tests | Pure domain logic, calculations, policy evaluation, edge cases |
| Component tests | Rendering, interaction, forms, loading/error/empty states |
| Service/API tests | Route schemas, orchestration, errors, authorization, transactions |
| Repository integration | SQL, migrations, constraints, transaction behavior |
| Contract tests | Client/server payload compatibility and generated API clients |
| End-to-end tests | A small number of critical user journeys in a real browser |
| Non-functional tests | Accessibility, performance, resilience, and security controls |

Do not mock the behavior under test. Prefer fakes for narrow owned interfaces,
network-level mocks for external HTTP dependencies, and real infrastructure
for persistence behavior.

## Coverage Policy

- Coverage must not decrease without explanation.
- Critical policy and business modules require branch and negative-path tests.
- Changed code should be meaningfully exercised, but no universal percentage
  proves correctness.
- Exclude generated code and declarative glue only when the exclusion is
  explicit and justified.
- Treat surviving mutations, production defects, and repeated regressions as
  stronger evidence of a test gap than a coverage number.

## Suite Qualities

Tests must be deterministic, isolated, order-independent, and parallel-safe.
Control time, randomness, identity, network responses, and test data. A flaky
test is a defect: fix or quarantine it with an owner and deadline.

## CI Tiers

| Trigger | Required evidence |
|---------|-------------------|
| Local/changed files | Type-check, lint, focused unit/component/API tests |
| Pull request | Full unit and integration suites, contract generation check, critical Playwright smoke tests |
| Main branch | Full browser suite and packaging/build checks |
| Scheduled | Cross-browser, performance, dependency, and deeper security checks |

Every bug fix must include a regression test at the lowest level that
reproduces the defect faithfully. Every acceptance criterion must map to
automated evidence or an explicit manual verification step.

## Primary References

- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Fastify Testing Guide](https://fastify.dev/docs/latest/Guides/Testing/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
