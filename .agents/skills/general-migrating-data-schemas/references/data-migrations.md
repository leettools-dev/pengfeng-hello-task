# Data Migrations and Retention

A schema is code that owns user data, so it changes under the same discipline as
code: versioned, reviewed, reversible in effect, and shipped with the change that
needs it. Retention is the companion policy — deciding, per entity, how long data
lives and how it dies.

## Migration Rules

- **Forward-only and ordered.** Migrations are append-only, numbered/timestamped,
  and applied in sequence. Never edit a migration that has run anywhere.
  `[Specification, must-have]`
- **Committed with the code that needs them.** A schema change and the code using
  it land in the same change set so no checkout is left inconsistent.
  `[Specification, must-have]`
- **One tool, recorded in the dev spec.** Postgres is the only engine (see
  [data-and-analytics.md](../../general-instrumenting-product-analytics/references/data-and-analytics.md)); migrations are
  **Drizzle + drizzle-kit** generated SQL under `design/schemas/`.
- **Migrations run automatically and idempotently at deploy/startup**, tracked in
  a migration-history table so re-runs are no-ops.

## Safe Schema Change

- **Expand, migrate, contract** for anything not trivially additive: add the new
  column/table, backfill, switch the code, then remove the old shape in a later
  migration — never rename-in-place under live traffic. `[Specification, should-have]`
- **Backfills are batched and resumable**, not one unbounded `UPDATE` that locks
  a hot table.
- **Destructive steps are deliberate.** Dropping a column or table is its own
  reviewed migration after the code no longer references it — consistent with
  [general-operating-safely](../../general-operating-safely/SKILL.md).
- A migration's effect must be **recoverable**: rely on backups for true
  rollback, but never ship a step whose failure leaves data unreadable.

## Retention and Deletion

Choose per entity from its recovery, audit, and erasure requirements; record the
choice in the dev spec's Data Model. `[Specification, must-have]`

| Strategy | Use when |
|----------|----------|
| Hard delete | No recovery/audit need; or erasure is legally required |
| Soft delete (`deleted_at`) | Users undo, or related data must survive briefly |
| Archive then purge | Long-tail history needed cheaply (move cold rows out, e.g. to Parquet) |

- A retained "deleted" row must be **excluded from normal reads** at the
  repository layer — soft delete that still appears in queries is a defect.
- Define a **purge job** that enforces the maximum retention window; retention
  without enforcement is an aspiration.
- Honor erasure requests even against soft-deleted/archived copies.

## Testing

- Run migrations against a **real database** in CI (Postgres in Docker) — not
  a mock — per [testing-strategy.md](../../general-testing-strategies/references/testing-strategy.md).
- Test the **forward path on representative data**, including the backfill, and
  assert constraints hold afterward.
- Cover soft-delete/retention filtering with negative-path tests: deleted rows
  must not leak into reads or exports.

## Primary References

- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Postgres `ALTER TABLE`](https://www.postgresql.org/docs/current/sql-altertable.html)
