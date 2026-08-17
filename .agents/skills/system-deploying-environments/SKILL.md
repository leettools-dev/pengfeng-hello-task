---
name: system-deploying-environments
description: "Promote a product through local → staging → production with preflight/plan/apply/rollback discipline; generic procedure here, provider-specific execution via the toolchain's utility repos (e.g. leet-deploy)."
layer: lifecycle
applies_when:
  deploy_target: [gcp, fly]
peers:
  - general-managing-configuration
  - general-migrating-data-schemas
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Deploying Environments

## Overview

This skill defines the environment model and deployment discipline for a
product venture: what `deploy/local/`, `deploy/staging/`, and
`deploy/production/` each contain, and the order of operations for any deploy.
It is deliberately provider-agnostic — provider-specific commands, IaC, and
credentials live in a sibling utility repo (typically `leet-deploy`) declared
in `.agents/toolchain.json`, whose skills are installed alongside this one and
pinned in `.agents/toolchain-lock.json`.

Use this skill when:
- Setting up staging or production for the first time
- Deploying a release
- Building a service that deploys customer/venture workloads
- Writing or reviewing the contents of `deploy/*/`

## Prerequisites

Requires a deployment utility repo pinned in `.agents/toolchain-lock.json`
(e.g. `leet-deploy`) with a working `preflight` command, plus that repo's
documented credentials. Without one, this skill can prepare `deploy/local/`
and the environment contract, but must stop before any remote mutation and
report the missing toolchain entry — do not improvise cloud deployment with
ad-hoc provider CLIs.

When the target provisions VMs (GCP, AWS), the credential set also includes an
**SSH keypair supplied by the environment** — see
[SSH Access to Provisioned VMs](#ssh-access-to-provisioned-vms).

## SSH Access to Provisioned VMs

A deploy that creates a VM reaches it over SSH. The keypair for that is an
**existing platform credential passed in**, on the same footing as the cloud
service account or the DNS API token — not something a deploy run mints:

- The platform owns one keypair per deploy identity and injects it into every
  runner and agent harness (for `leet-deploy`: `LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY`
  and `LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY`, holding the **key values themselves**,
  not paths to key files; the matching public key is what the VM's
  `authorized_keys` is seeded with at creation). Every harness in a job sees the
  same pair, so a VM one run created stays reachable from the next.
- Consume them as values. `leet-deploy` reads both variables from the
  environment, so pass neither `--ssh-private-key` nor `--ssh-public-key` — a
  key expanded into argv is readable by `ps`, shell tracing, and command
  auditing. Anything speaking SSH directly (ssh2 and friends) takes the variable
  as key material; never `readFileSync` it and never treat it as a pathname.
- A harness must not generate a keypair, and must not treat one as its own
  state: a key created inside a run is absent from the VM it did not create,
  dies with the container, and is a credential no operator can rotate or revoke.
- The keypair is declared in the secrets manifest by name and valued outside
  the repo. Key material is never printed, logged, committed, copied into
  `deploy/`, or written to a file inside a run — not to the workspace, not to
  `/tmp`, not to `~/.ssh`.
- Presence and usability of both variables are **preflight checks**. A missing
  or malformed key stops the deploy with the exact variable named, exactly like
  an absent cloud credential — it is never worked around by making a new key.
- Rotation belongs to the platform: replace the injected pair and re-seed VM
  `authorized_keys` through the provider, never by hand-editing a running host
  (that is the snowflake-production anti-pattern).

## Environment Model

**The environment set is a decision, not a default.** Which of these a product
actually has is declared and recorded before build work, each with its deploy
target, domain, the read-only preflight that proves the target is reachable, and
the environment variables it consumes by name. The directory layout is not the
declaration: a scaffold ships `deploy/staging/` whether or not staging exists,
so an undeclared environment set leaves an agent to infer one from directories
and discover the truth at deploy time — when it can report the gap but not fix
it.

A **production-only** product is a legitimate posture. A small venture with one
target, deployed by an autonomous pipeline, may reasonably decide that a second
cloud environment is not worth its cost. What is not legitimate is leaving that
undecided and calling it staging drift later. Declare it, and replace the
rehearsal rather than dropping it — see
[Rehearsal Without Staging](#rehearsal-without-staging).

| Environment | Purpose | Contract |
|-------------|---------|----------|
| `deploy/local/` | Full stack on the dev machine (Docker Compose) | Anyone (agent included) can boot the product with one command; parity with production services, not with production scale |
| `deploy/staging/` | Production-shaped rehearsal | Same deploy mechanism and migrations as production; safe to break; seeded, never real user data. **Optional** — declared or explicitly declined |
| `deploy/production/` | Users | Changes arrive only via the deploy procedure below — never by SSH-and-edit |

**Own your backing services with Docker Compose.** For a simple app, run the
required services (database, cache, queue) as Compose services the project owns —
one `docker-compose.yml` at the repo root that starts the app and its database
together — rather than depending on a managed cloud database. The same Compose
stack is the parity target promoted to staging/production, so "works locally" and
"works in production" use the same mechanism. Backups and monitoring for a
self-run database are added later; a first cut may defer them, but note the debt.
Secrets come from the repo's gitignored `.env` (see
[configuration.md](../general-managing-configuration/references/configuration.md)), prepared before
the stack is brought up.

### Rehearsal Without Staging

Staging exists for one reason: the release path executes once against something
that is not users. A product that declares no staging environment owes that
rehearsal anyway, against a production-shaped local stack:

- Same images, same migration path, same configuration mechanism as production —
  a rehearsal that differs in mechanism rehearses nothing.
- Seeded data, never real user data.
- The full smoke suite passes there, and the record is timestamped before the
  production apply.

This is what replaces `deploy/staging/` for a single-environment venture; it is
not permission to apply straight to production from an untested build. Skipping
both is the recorded decision the checklist refuses to accept silently.

Configuration and secrets follow [configuration.md](../general-managing-configuration/references/configuration.md):
same config schema everywhere, per-environment values, secrets never in the
repo. A config value that differs between staging and production must be a
declared environment variable, not a code branch.

## Products That Deploy Other Workloads

A deploy-as-a-service product has two explicit targets with separate
pipelines, credentials, state, and rollback:

| Target | Meaning | Pipeline owner |
|--------|---------|----------------|
| **Platform deployment** | Promote the orchestrating service itself | This repository's `deploy/local/`, `deploy/staging/`, and `deploy/production/` |
| **Managed-workload deployment** | Publish one customer/venture artifact on demand | A `DeployProvider` port invoked per workload, with deployment state recorded durably |

A request such as "deploy to `<domain>`" is incomplete for this product shape.
Name `platform` or a managed workload id before planning, and confirm the exact
domain belongs to that target before any DNS or provider mutation.

Model managed deployment as a capability port owned by application logic. The
interface must preserve the same preflight → plan → apply → verify/rollback
discipline as a platform deploy; it must not collapse remote mutation into an
unreviewable `deploy(files)` call.

```typescript
interface DeployProvider {
  preflight(input: DeployInput): Promise<PreflightResult>;
  plan(input: DeployInput): Promise<DeployPlan>;
  apply(plan: DeployPlan): Promise<{ deploymentId: string; liveUrl: string }>;
  verify(deploymentId: string): Promise<VerifyResult>;
  rollback(deploymentId: string): Promise<void>;
}
```

- The local adapter serves built files through a real reachable static host in
  the local stack. This makes URLs and end-to-end behavior testable without
  cloud credentials; returning a fabricated URL is not an adequate adapter.
- Staging/production adapters wrap the pinned provider CLI from the toolchain
  (normally `leet-deploy`). Provider commands and credentials remain outside
  application services.
- Run one shared contract suite against local and remote/sandbox adapters.
  Record deployment id, target, artifact digest, URL, plan, status, and
  rollback lineage in durable state so a process restart cannot orphan a
  deployment.

## Production-Readiness Gate

Before a production plan, inventory every configured stateful or external port
and name its selected adapter. Production must use durable declared adapters
for state that must survive a restart and real provider adapters for required
side effects. An in-memory, no-op, fake, or local-static adapter is a hard stop
unless the dev spec explicitly proves that the capability is non-durable and
non-production by design.

The gate includes database migrations, job/queue durability, object/vault
storage, Git/repository state, secret storage, email/event delivery, and
managed-workload deployment. Verify backup/recovery and adapter contract-test
evidence as part of the plan; a healthy process with volatile product state is
not production-ready.

## Deployment Procedure

Every deploy — staging or production — runs the same four verbs, in order:

1. **Preflight.** Name the deploy target (platform or managed workload) and the
   declared environment it belongs to, then verify tool versions, selected
   production adapters, credentials, DNS/cloud permissions, and target health
   *before* mutating anything. Fail → stop and
   report the exact missing piece. (See "Skills That Require Binaries" in the
   repo README.)
2. **Plan.** Produce a diff of what will change — infrastructure plan, image
   tag, pending migrations. A human approves production plans; an agent may
   apply staging plans autonomously if CI is green.
3. **Apply.** Execute the plan. Database migrations follow
   [data-migrations](../general-migrating-data-schemas/references/data-migrations.md) — expand
   first, deploy, contract later; never couple a destructive migration to the
   same deploy that stops reading the old shape.
4. **Verify.** Health endpoint, smoke test of the critical user flow, error
   rate for ~10 minutes, and the durability of time-bounded dependencies. For
   every certificate, credential, lease, or signed artifact whose expiry can
   break the deployment, prove an unattended renewal/rotation path once and
   monitor its failure independently. A deploy is done when verification and
   durability pass, not when apply exits 0.

**Rollback** is a first-class path, rehearsed on staging before it's needed:
know the command that restores the previous version, confirm it works with the
current migration state, and prefer rolling back to diagnosing live (see
`ops-responding-to-incidents`).

Order of promotion: local (tests pass) → staging (deploy + verify) →
production (plan approved → apply → verify). Skipping staging is a recorded
decision, not a habit.

Do the non-mutating capability preflight during repository scaffolding, before
substantial build spend, and record its verdicts where later steps can resolve
against them rather than re-deriving them. A capability probed at the step that
consumes it is probed too late: the run that finds no staging environment, no
deploy credential, or no telemetry sink at deploy time can only report and park,
and every hour of build spend before that point was committed on an assumption. Once the first production-shaped vertical slice is
deployable, rehearse it on staging rather than waiting for feature completeness;
that early rehearsal does not replace the final release-candidate staging gate.

## Anti-Patterns

- **Snowflake production.** Manual fixes applied over SSH that no file records.
- **Staging drift.** Staging deployed by a different mechanism than production, rehearsing nothing.
- **Undeclared environment set.** Nobody decided which environments exist, so a deploy-time invocation infers them from directory names and hits the gap it cannot fix.
- **Rehearsal dropped, not replaced.** A production-only venture treats "no staging" as "no rehearsal", and the release path executes for the first time against users.
- **Apply without plan.** Mutating cloud state with no reviewed diff.
- **Untested rollback.** A rollback command first executed during an incident.
- **Works only until expiry.** A healthy launch whose certificate or credential
  has no observed unattended renewal path.
- **Self-minted deploy keys.** A run generating its own SSH keypair instead of
  using the injected one — unreachable VMs, and a credential outside the
  rotation path.
- **Provider logic in prompts.** Cloud specifics belong in the utility repo's tested CLI, not in skill text.
- **Ambiguous target.** Treating the platform deployment and a managed workload
  deployment as the same pipeline or domain.
- **Volatile production.** Shipping an in-memory, fake, no-op, or local-only
  adapter for state or side effects the product promises to retain.

## Checklist

- [ ] Toolchain entry pinned; preflight passes before any remote action
- [ ] VM targets use the injected SSH keypair as values from the environment (no key in argv, no key written to a file); preflight proves both variables are present and usable
- [ ] Target named explicitly: platform or managed workload id; exact domain confirmed
- [ ] Every stateful/external production port maps to a declared durable/real adapter
- [ ] Adapter contract suites pass against the engines/providers used by the target
- [ ] Environment set declared and recorded — each environment with its target, domain, preflight, and required variables; no entry left undecided
- [ ] One-command local stack boots and passes tests
- [ ] Deploy-as-a-service products expose a reachable local static-host adapter
- [ ] Staging uses the production deploy mechanism — or, for a declared production-only venture, the production-shaped local rehearsal passed the full smoke suite before the apply
- [ ] Production plan reviewed by a human before apply
- [ ] Migrations follow expand/contract sequencing
- [ ] Post-deploy verification on the critical flow, not just health
- [ ] Every expiring dependency has observed unattended renewal/rotation and an independent alert
- [ ] Rollback rehearsed on staging
