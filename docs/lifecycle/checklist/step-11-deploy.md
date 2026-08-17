# Checklist — Step 11: Deploy

Gate (from lifecycle): Staging verified before production; health check,
critical-flow smoke test, ~10 minutes of error-rate observation, and renewal
proof for every expiring dependency pass. A deploy is done when verification
and durability pass, not when apply exits 0.

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
- Applicability: `.agents/capabilities.json` probe `environment-set` verdict =
  `unavailable`, evidence: ".agents/environments.json declares local,
  production environment(s) and no staging environment — this venture is
  production-only by decision, so the staging rehearsal is replaced by the
  production-shaped local rehearsal." This is a made, recorded step-00
  decision (`.agents/environments.json` `staging.declared = false` with an
  explanatory comment), not an undiscovered gap.
- Status: N/A — capability:environment-set unavailable — ".agents/environments.json
  declares local, production environment(s) and no staging environment — this
  venture is production-only by decision, so the staging rehearsal is replaced
  by the production-shaped local rehearsal."

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
- Applicability: `.agents/environments.json`: `staging.declared = false`;
  `local` environment declared with `deploy_target: docker-compose`
  (`deploy/local/docker-compose.yml`, image `node:24`, same Node major version
  as production's `.nvmrc`/`toolchain-lock` pin). No migrations exist (no
  persistent data per PRD §Data and roles), so the rehearsal reduces to:
  bring up the local docker-compose stack from the release candidate, run the
  smoke suite against it, before the production apply.
- Status: MET — Rehearsed against the exact production mechanism, not the
  dev-only `docker-compose.yml`: built the real production artifact
  (`docker build -t hello-task:local -f /workspace/Dockerfile /workspace`,
  same `node:24-slim` multi-stage image `leet-deploy edge apply` builds from
  this Dockerfile), ran it (`docker run -d -p 3000:3000 hello-task:local`,
  same `HOST=0.0.0.0`/`PORT=3000` configuration mechanism as production),
  and smoke-tested it: `GET /health` → `200 {"status":"ok"}`, `GET /` → `200`
  `text/html` containing "Hello, Venture!", over the published container
  port — 2026-08-17, before the production `leet-deploy edge apply` run.
  Container stopped and removed after capture. No migrations exist (no
  persistent data, per PRD §Data and roles) and no seed data was needed.

## deploy.health-check — Post-deploy health check passes  [must]

- Invariant: After each deploy, the service's health check reports healthy on the
  deployed version.
- Evidence required: The health-check response against the deployed environment.
- Counterexample: The app is "deployed" but its health endpoint returns 503.
- Applies when: The step runs.
- Status: PENDING

## deploy.smoke-critical-flows.look — Critical flow "Look" smoke-tested on the environment  [must]

- Invariant: `GET /` on the freshly deployed environment (rehearsal, then
  production) returns 200 HTML containing "Hello, Venture!", exercised end to
  end against the live URL.
- Evidence required: A smoke-test result for the "Look" flow on the rehearsal
  environment, then on `hello-task.pengfeng.leettools.ai`.
- Counterexample: The deploy succeeds and `/health` is green but `/` returns an
  error and nobody checked.
- Applies when: The step runs. Expand per critical flow.
- Applicability: PRD §Primary flow names exactly one critical flow: "Look."
- Status: PENDING

## deploy.error-observation — Error rate watched after cutover  [must]

- Invariant: Error and latency rates are observed for roughly ten minutes after
  production cutover and stay within normal bounds.
- Evidence required: The post-deploy error-rate/latency observation.
- Counterexample: "apply" exits 0, everyone leaves, and error rate spikes
  unnoticed.
- Applies when: The step runs.
- Status: PENDING
- Note: No telemetry sink is available (`.agents/capabilities.json` probe
  `telemetry-sink` = `unavailable`), so this observation must be done via
  direct polling of `/health` and `/` on the deployed URL for the ~10 minute
  window rather than a dashboard query — see `ops.telemetry-flowing` (step 13)
  for the recorded capability gap.

## deploy.rollback-confirmed — A rollback path exists and is known  [must]

- Invariant: A tested way to roll back to the previous version exists and is
  documented before the production apply.
- Evidence required: The rollback command/procedure, confirmed available.
- Counterexample: A bad deploy has no way back except a manual rebuild.
- Applies when: The step runs.
- Status: PENDING
- Status: MET — `deploy/production/README.md` now documents the rollback
  procedure: check out the previous good commit and re-run the same
  `leet-deploy edge apply` command (rebuilds the image from that commit's
  `Dockerfile` and redeploys to the same VM), or `leet-deploy edge reconcile`
  if only the edge stack needs reapplying. This is a real, available path —
  the deploy target is one VM with no separate image registry, so
  "redeploy the previous commit" is the rollback, not aspirational IaC.

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
- Applicability: `src/app/src/server.ts` reads `PORT`/`HOST` from
  `process.env` (see `spec.config-secrets-boundary`, step 04); the deploy
  target itself needs `DOCKER_HOST`, `GOOGLE_CLOUD_PROJECT`,
  `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `GODADDY_API_KEY`,
  `GODADDY_API_SECRET`, `LEET_DEPLOY_EDGE_TLS_EMAIL`, `LEET_DEPLOY_EDGE_ZONE`,
  `LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY`, `LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY` per
  `.agents/environments.json` `production.required_env`. Capability record
  `deploy-target` = `available`.
- Status: MET — `leet-deploy edge preflight --domain
  hello-task.pengfeng.leettools.ai`, run in this invocation, reports every
  required credential present and usable: `ok gcp.credentials.file`,
  `ok gcp.project`, `ok godaddy.credentials`, `ok tls.email: leettools@gmail.com`,
  `ok local.ssh_public_key`, `ok local.ssh_private_key`, `ok local.docker`
  (daemon reachable), `ok gcp.edge_permissions`, `ok godaddy.api`
  (credentials validated), `ok godaddy.zone` ("leettools.ai" accessible).
  No credential was generated locally — all read from the environment as
  injected values, per the assigned skill's SSH-key handling rules.

## deploy.long-lived-dependencies.tls-certificate — TLS certificate for the production domain renews unattended  [must]

- Invariant: The TLS certificate for `hello-task.pengfeng.leettools.ai` has an
  unattended renewal path, and renewal failure is monitored independently of
  the deploy process.
- Evidence required: The certificate's expiry horizon, renewal configuration,
  one successful forced renewal or provider-supported dry run, verification
  that the serving edge picked up the renewed value, and the independent
  expiry/failure alert.
- Counterexample: HTTPS is healthy at launch with a short-lived certificate,
  but no renewal job or managed-certificate controller exists, so the deploy
  has a known outage date.
- Applies when: Production depends on any expiring credential, certificate,
  token, lease, or signed artifact. Expand per dependency.
- Applicability: `.agents/environments.json` production `required_env`
  includes `LEET_DEPLOY_EDGE_TLS_EMAIL` and `LEET_DEPLOY_EDGE_ZONE`, and
  `deploy_target: leet-deploy` with a domain
  (`hello-task.pengfeng.leettools.ai`) — TLS certificate issuance/renewal is
  in scope via `leet-deploy`/`leet-ssl-cert` (`.agents/toolchain.json`).
- Status: PENDING
