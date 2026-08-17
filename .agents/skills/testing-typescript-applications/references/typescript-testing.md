# Testing TypeScript Applications

## Standard Tooling

| Concern | Default |
|---------|---------|
| Test runner | Vitest |
| React component tests | React Testing Library + `user-event` |
| HTTP mocking in UI tests | Mock Service Worker (MSW) |
| Fastify API tests | `app.inject()` |
| Postgres integration | Testcontainers, PGlite where semantics fit, or an equivalent disposable real engine |
| Browser tests | Playwright |
| Coverage | Vitest V8 provider |
| Type tests | `tsc --noEmit` and focused `expectTypeOf` tests |

## Test Organization

Colocate narrow unit and component tests with the owning module. Keep tests
that own infrastructure or full workflows in dedicated directories:

```text
src/
  features/documents/
    document-policy.ts
    document-policy.test.ts
    DocumentForm.tsx
    DocumentForm.test.tsx
tests/
  api/
  repositories/
  contracts/
e2e/
  fixtures/
  auth/
  documents/
```

Use `.test.ts`/`.test.tsx` for Vitest and `.spec.ts` for Playwright so commands
cannot accidentally run the wrong suite.

## Domain and Service Tests

- Prefer table-driven tests for permission matrices and boundary values.
- Inject clocks, ID generators, and owned gateways when nondeterminism matters.
- Assert outputs and state transitions, not private method calls.
- Use repository fakes only for service behavior that does not depend on SQL
  semantics.

## React Component Tests

- Query by accessible role, label, and visible text.
- Interact through `user-event`.
- Test loading, success, empty, validation, and failure states.
- Use MSW to exercise the real API client and TanStack Query integration.
- Do not assert component internals, hook call counts, or CSS implementation
  details unless they are the public contract.

## Fastify API Tests

Build the application without listening on a port and exercise it with
`app.inject()`. Route tests should cover:

- request validation and response serialization
- authentication and authorization outcomes
- error-envelope mapping
- transaction-level service behavior
- headers, cookies, and status codes that are part of the contract

Close the app after tests so plugins and database pools release resources.

## Repository Tests

Test SQL against the same database engine used in production. Apply actual
migrations to a disposable database and cover constraints, joins, ordering,
pagination, transactions, and tenant scoping. An in-memory substitute is not
evidence that Postgres-specific behavior works.

## Adapter Contract Tests

When a capability has multiple adapters, define one behavior contract and run
the same cases against every implementation. The suite owns setup/cleanup and
tests observable semantics such as idempotency, conflict behavior, ordering,
not-found handling, atomic transitions, and resolve-once races; it does not
assert provider-specific internals.

An in-memory adapter is useful for fast service tests but cannot validate a
durable adapter. Run the contract against the durable implementation with its
real schema, migrations, constraints, and transaction behavior. For Postgres,
PGlite is acceptable for compatible in-process SQL/constraint behavior; use an
actual disposable Postgres instance (for example Testcontainers) when the risk
depends on server concurrency, extensions, networking, or behavior PGlite does
not reproduce. Apply the same rule to other engines and provider sandboxes.

```typescript
export function ledgerContract(
  name: string,
  createLedger: () => Promise<{ ledger: Ledger; close: () => Promise<void> }>,
) {
  describe(name, () => {
    it("resolves a decision at most once", async () => {
      const { ledger, close } = await createLedger();
      try {
        const decision = await ledger.createDecision(fixtureDecision());
        await expect(ledger.resolveDecision(decision.id, "approve")).resolves.toBeDefined();
        await expect(ledger.resolveDecision(decision.id, "reject")).rejects.toMatchObject({
          code: "ALREADY_RESOLVED",
        });
      } finally {
        await close();
      }
    });
  });
}

ledgerContract("in-memory ledger", createMemoryLedger);
ledgerContract("Postgres ledger", createMigratedPostgresLedger);
```

Keep provider-only tests in addition to the shared contract when an adapter has
unique retry, signing, pagination, or rate-limit behavior.

## Contract and Type Tests

Follow [API Contracts](../../general-designing-apis/references/api-contracts.md). Generate the client
from OpenAPI and compile a small set of representative calls. Use type tests
for public generic utilities and APIs whose TypeScript behavior is part of the
product.

## Commands

Projects should expose stable scripts:

```json
{
  "scripts": {
    "check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test"
  }
}
```

Keep unit tests fast enough for continuous local use. Separate integration and
browser suites when their setup cost would make the default feedback loop
slow.

## Primary References

- [Vitest](https://vitest.dev/guide/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Vitest Type Testing](https://vitest.dev/guide/testing-types.html)
- [Testing Library](https://testing-library.com/docs/guiding-principles/)
- [Mock Service Worker](https://mswjs.io/docs/)
- [Fastify Testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [Testcontainers for Node.js](https://node.testcontainers.org/)
- [PGlite](https://pglite.dev/)
