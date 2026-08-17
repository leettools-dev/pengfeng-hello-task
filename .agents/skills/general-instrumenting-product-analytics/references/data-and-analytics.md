# Data and Analytics Architecture

These applications handle a reasonable volume of transactions *and* analytical
queries. The two workloads have opposite access patterns; the classic failure
mode is letting dashboards lock up live writes. This document defines how to
separate the workloads **inside one engine**.

**Postgres is the only database engine.** Earlier drafts split OLTP (Postgres)
onto one engine and OLAP (DuckDB) onto another; the split bought scan speed at
the cost of a second engine, a copy pipeline, and a second migration story.
The chosen simplification is Postgres everywhere — locally as a Docker Compose
service (`deploy/local/`), in staging/production as provider-managed Postgres
via `leet-deploy` — with workload separation done by pattern, not by engine.
Postgres also serves as the application data plane
and, via `pgvector`, the retrieval plane.

## Transactional vs. Analytical

The workload distinction survives even though the engine split does not:

| | Transactional (OLTP) | Analytical (OLAP) |
|---|---|---|
| Access pattern | Many small reads/writes by key | Few large scans, aggregations, group-by |
| Shape | Row-oriented, normalized | Wide, denormalized summaries |
| Correctness need | ACID, concurrency, durability | Consistent snapshot, throughput |
| Where it runs | Primary tables, live connections | Rollup tables / materialized views, refreshed on schedule; a read replica when scale demands |

Decide per *workload*, not per app. A single product usually has both: the
primary tables hold the source of truth; rollups answer the analytical
questions over a derived copy.

## Storage Selection

1. **Every program stores state in Postgres.** Service, local tool, or
   analytical job — same engine, same migration tooling, same repository
   pattern. No SQLite, no embedded engines as systems of record.
   `[Specification, must-have]`
2. **Local development runs the same Postgres via Docker Compose.** Dev/prod
   parity beats embedded convenience; the scaffold's `deploy/local/` stack
   starts the app and its database together. `[Specification, must-have]`
3. **Do not run heavy analytical scans against the hot OLTP tables that serve
   live writes.** Read from scheduled rollups or materialized views; add a
   read replica only when a recorded Architecture Decision shows rollups are
   not enough. `[Specification, should-have]`
4. **Vector and embedding search uses `pgvector`** on the same instance — no
   separate vector database. `[Specification, must-have]`
5. Do not reach for a data warehouse, streaming system, or Spark until a
   recorded Architecture Decision shows Postgres cannot meet the requirement.
   Most "reasonable volume" workloads never need more.

## Analytical Patterns in Postgres

- **Rollups are scheduled jobs.** Summary tables are refreshed by declared
  jobs on the scheduler plane, not
  computed per dashboard request. Dashboards read summaries, never raw event
  tables.
- **Materialized views for query-shaped summaries** — `REFRESH MATERIALIZED
  VIEW CONCURRENTLY` on a schedule; record each consumer's tolerated
  staleness in the dev spec's Data Model section.
- **Partition large append-only tables** (events, analytics) by time range;
  retention enforcement becomes dropping a partition instead of a bulk
  `DELETE`.
- **Analytics events are OLTP writes** — small inserts into append-only
  tables at request time; analysis reads the rollups.
- **Push work into SQL.** Aggregate, filter, and window in the database;
  return small result sets. Do not pull rows into JS to reduce them.
- **Ad-hoc exploration of files** (Parquet/CSV exports, one-off local
  crunching) may use any scratch tool, but its results never become a system
  of record and no shipped code path may depend on one.

## Data Flow and Boundaries

- The **system of record is the primary OLTP tables.** Analytical copies are
  derived and rebuildable; never let a dashboard become the only place a
  fact exists.
- Define how each analytical dataset is refreshed (on-demand query,
  scheduled rollup, or materialized view) and the **freshness/staleness**
  each consumer tolerates. Record it in the dev spec's Data Model section.
- Keep SQL inside repository modules; no ad-hoc SQL in route handlers or
  components. See the Fastify guide's data layer conventions.
- Validate data crossing non-HTTP trust boundaries (files, exports,
  third-party feeds) — see [api-contracts.md](../../general-designing-apis/references/api-contracts.md).

## Migrations and Retention

Schema evolution and retention/deletion policy are defined in
[data-migrations.md](../../general-migrating-data-schemas/references/data-migrations.md): forward-only, committed with the code
that needs them, with a chosen soft-delete / archival / hard-delete policy per
entity.

## Primary References

- [Postgres documentation](https://www.postgresql.org/docs/)
- [Postgres materialized views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [Postgres table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [pgvector](https://github.com/pgvector/pgvector)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
