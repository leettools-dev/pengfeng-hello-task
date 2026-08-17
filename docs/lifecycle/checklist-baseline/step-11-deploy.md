# Baseline Checklist — Step 11: Deploy

Gate (from app-building.md): Staging verified before production; health check,
critical-flow smoke test, ~10 minutes of error-rate observation, and renewal
proof for every expiring dependency pass. A deploy is done when verification
and durability pass, not when apply exits 0.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

Evidence discipline: an item resolved because a deploy target or credential is
unavailable must cite the literal captured output of the named preflight/doctor
command, run in the same invocation that sets the status — not a prose claim. A
status inherited from an earlier invocation's notes or self-review does not
satisfy this; no invocation may treat "deploy is blocked" as settled without
having just re-run the preflight itself.

## deploy.staging-first — Staging is deployed and verified before production  [must]

- Invariant: The change is deployed to staging and verified there before any
  production apply.
- Evidence required: The staging deploy record and its verification result,
  timestamped before production.
- Counterexample: Production is deployed directly, skipping staging.
- Counterexample: The venture declared a staging environment and the item is
  resolved against a rehearsal on the local stack instead.
- Applies when: The venture's declared environment set includes a staging
  environment. A venture that declared production-only resolves this
  `N/A — capability:environment-set unavailable …` citing that record, and
  satisfies `deploy.prerelease-rehearsal` instead. "There is no staging target"
  discovered at this step is not an N/A — it is a step-00 decision that was
  never made.
- Status: PENDING

## deploy.prerelease-rehearsal — A production-only venture rehearses before the apply  [must]

- Invariant: Where no staging environment exists, the release candidate is
  exercised against a production-shaped stack — same images, migrations, and
  configuration mechanism as production, seeded data, never real user data —
  and the full smoke suite passes there before the production apply. This is
  the staging rehearsal's intent, not a weaker substitute for it.
- Evidence required: The rehearsal record: what was brought up, which migrations
  ran, the smoke-suite result, and its timestamp before the production apply.
- Counterexample: A production-only venture skips rehearsal entirely because
  the staging item was marked `N/A`, so the first execution of the release path
  is against users.
- Counterexample: The rehearsal runs against a stack that differs from
  production in mechanism — a different runtime, a bypassed migration path —
  and therefore rehearses nothing.
- Applies when: The venture's declared environment set has no staging
  environment. A venture with staging resolves this `N/A` citing the
  environments record — not a `capability:` token, since here the capability is
  present rather than absent — and satisfies `deploy.staging-first` instead.
- Status: PENDING

## deploy.health-check — Post-deploy health check passes  [must]

- Invariant: After each deploy, the service's health check reports healthy on the
  deployed version.
- Evidence required: The health-check response against the deployed environment.
- Counterexample: The app is "deployed" but its health endpoint returns 503.
- Applies when: The step runs.
- Status: PENDING

## deploy.smoke-critical-flows — Critical flows smoke-tested on the environment  [must]  (per flow)

- Invariant: Each critical user flow is exercised against the freshly deployed
  environment and works end to end.
- Evidence required: A smoke-test result per critical flow on staging, then
  production.
- Counterexample: The deploy succeeds but sign-in is broken and nobody checked.
- Applies when: The step runs. Expand per critical flow.
- Status: PENDING

## deploy.error-observation — Error rate watched after cutover  [must]

- Invariant: Error and latency rates are observed for roughly ten minutes after
  production cutover and stay within normal bounds.
- Evidence required: The post-deploy error-rate/latency observation.
- Counterexample: "apply" exits 0, everyone leaves, and error rate spikes
  unnoticed.
- Applies when: The step runs.
- Status: PENDING

## deploy.rollback-confirmed — A rollback path exists and is known  [must]

- Invariant: A tested way to roll back to the previous version exists and is
  documented before the production apply.
- Evidence required: The rollback command/procedure, confirmed available.
- Counterexample: A bad deploy has no way back except a manual rebuild.
- Applies when: The step runs.
- Status: PENDING

## deploy.secrets-present — Required secrets present in the target environment  [must]

- Invariant: Every secret and config value the environment needs is present and
  scoped before deploy; a missing one stops the deploy with a report, not a
  half-broken service. Access credentials for the deploy target itself — cloud
  service account, DNS token, and the SSH keypair used to reach provisioned VMs
  — are supplied by the environment and used as given; a deploy run never
  generates its own.
- Evidence required: The literal captured output of the named presence check
  (doctor/preflight command) against the environment, run in this invocation.
- Counterexample: Production boots without the email key and fails at first
  sign-in.
- Counterexample: An earlier invocation reports credentials as unavailable; a
  later invocation copies that conclusion into evidence without re-running the
  preflight command, while the credentials were present in the environment the
  whole time.
- Counterexample: The injected SSH private key is missing, so the deploy
  generates a keypair instead of stopping; the VM comes up trusting a key that
  disappears with the container.
- Applies when: The product reads any secret or environment config.
- Status: PENDING

## deploy.long-lived-dependencies — Expiring deploy dependencies renew unattended  [must]  (per dependency)

- Invariant: Every expiring credential, certificate, lease, or other
  time-bounded dependency required to keep the production URL healthy has an
  unattended renewal/rotation path, and failure is monitored independently.
- Evidence required: For each dependency, its expiry horizon, renewal
  configuration, one successful forced renewal or provider-supported dry run,
  verification that the serving system picked up the renewed value, and the
  independent expiry/failure alert.
- Counterexample: HTTPS is healthy at launch with a 90-day certificate, but no
  timer, managed-certificate controller, or renewal job exists, so the deploy
  has a known outage date.
- Applies when: Production depends on any expiring credential, certificate,
  token, lease, or signed artifact. Expand per dependency.
- Status: PENDING
