---
name: general-migrating-data-schemas
description: "Change a database schema safely — forward-only ordered migrations shipped with their code, expand/migrate/contract for non-additive changes, batched resumable backfills, and a per-entity retention and deletion decision. Use when adding or altering tables, backfilling, dropping columns, or setting retention."
layer: lifecycle
peers:
  - general-instrumenting-product-analytics
  - general-testing-strategies
  - general-operating-safely
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Migrating Data Schemas

## Overview

A schema is code that owns user data, so it changes under the same discipline
as code: versioned, reviewed, reversible in effect, and shipped with the change
that needs it. Retention is the companion policy — deciding, per entity, how
long data lives and how it dies.

This is a shared-policy skill: backend and deployment skills declare it as a
peer rather than restating the rules. The full policy — migration rules, safe
schema change, retention strategies, and testing — is in
[references/data-migrations.md](references/data-migrations.md).

Use this skill when:
- Adding or altering a table, column, index, or constraint
- Backfilling data, or removing a column the code no longer reads
- Deciding how long an entity's data is kept and how it is deleted
- Reviewing a migration before it runs against real data

## Process

### Step 1: Classify the Change

| Change | Path |
|--------|------|
| Trivially additive (new nullable column, new table) | Single migration, ship with the code |
| Non-additive (rename, retype, narrow a constraint) | Expand → migrate → contract, across releases |
| Destructive (drop column/table) | Its own reviewed migration, after the code stops referencing it |

Never rename in place under live traffic. The expand/migrate/contract sequence
exists because old and new code run simultaneously during a deploy.

### Step 2: Write the Migration

Generated SQL, numbered or timestamped, append-only. A migration that has run
anywhere is immutable — correct it with a new migration, never by editing.
Commit it in the same change set as the code that needs it.

### Step 3: Plan the Backfill

Batched and resumable, with a bounded work unit — not one unbounded `UPDATE`
that locks a hot table. Confirm the job can be stopped and restarted without
double-applying.

### Step 4: Decide Retention

Choose per entity from its recovery, audit, and erasure requirements, and
record the choice in the dev spec's Data Model. A retained "deleted" row must
be excluded from normal reads at the repository layer, and the maximum
retention window needs a purge job — retention without enforcement is an
aspiration.

### Step 5: Test Against a Real Database

Run the migration against Postgres in Docker in CI, on representative data,
including the backfill. Assert constraints hold afterward, and cover
soft-delete filtering with negative-path tests: deleted rows must not leak into
reads or exports.

## Anti-Patterns

- **Editing a migration that has run.** Any environment already past it silently
  diverges.
- **Schema and code in separate change sets.** Leaves a checkout that cannot
  boot in either direction.
- **Rename-in-place under live traffic.** The old code is still running during
  the deploy.
- **Unbounded backfill.** One `UPDATE` over a hot table is an outage.
- **Soft delete that still appears in queries.** That is a defect, not a
  retention strategy.
- **Testing migrations against a mock.** Constraints, types, and locks are
  exactly what a mock does not model.

## Checklist

- [ ] Change classified; non-additive changes use expand/migrate/contract
- [ ] Migration is append-only, ordered, and committed with its code
- [ ] Backfill batched and resumable
- [ ] Destructive steps isolated in their own reviewed migration
- [ ] Retention strategy chosen per entity and recorded in the dev spec
- [ ] Purge job enforces the retention window
- [ ] Migration run against a real Postgres in CI, with constraint assertions
- [ ] Negative-path tests confirm deleted rows do not leak
