---
name: leet-development-foreman
description: "Drive a bootstrapped product repository through its instantiated lifecycle checklist under Harness Foreman. Use for iterative, checkpointed product delivery where Foreman must keep assigning Pi work until the deterministic completion gate passes, including verified deployment when the checklist requires it."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Delivering a Product Under Harness Foreman

## Authority

The repository is the durable state. The PRD, lifecycle plan, and specialized
checklists were created during bootstrap and are authoritative. Do not replace,
weaken, delete, or mark them complete merely to end an invocation.

Read these files before acting:

1. every PRD under `docs/prd/`. A `<name>.expanded.md` beside a `<name>.md` is
   the completed form of that PRD, not a second product: build against the
   expansion's acceptance criteria, treat the original as authoritative for
   intent, and never edit the original — corrections go in the expansion, marked
   as assumptions like the rest of what it added
2. `docs/lifecycle/plan.md`
3. the selected repository work prompt:
   - `.agents/prompts/work-dev-cycle.md` for `dev-cycle`
   - `.agents/prompts/work-lifecycle.md` for `full-lifecycle`
4. every applicable checklist under `docs/lifecycle/checklist/`
5. `.agents/capabilities.json` — the recorded verdict for every external
   capability a later item depends on, and `.agents/environments.json`, the
   environment set it was built from
6. `.github/workflows/` and the package-manager manifests and lockfiles

Select the cycle before assigning work. Use `dev-cycle` when the job asks for
the essential PRD-to-live-web-app development cycle. Use `full-lifecycle` when
the job asks for the complete venture lifecycle. If the job does not say, use
`dev-cycle` only when `.agents/prompts/work-dev-cycle.md` exists and the stated
goal stops at a live web app; otherwise use `full-lifecycle`.

## Work One Bounded Unit

Each invocation is one worker turn in a longer Foreman job:

1. Inspect `git status --short --branch` and recent commits. Preserve recovered
   work and continue from it.
2. Find the earliest applicable checklist step in the selected cycle with
   unresolved `PENDING` items. For `dev-cycle`, consider only steps 0, 2, 4-9,
   and 11; still run structural checks over the complete plan.
3. Complete one coherent, reviewable unit from that step. Follow the installed
   skills named by the lifecycle plan and the repository work prompt.
4. Produce the evidence the checklist requires. Change `PENDING` to `MET` only
   when that evidence exists; use `N/A` only with a concrete applicability
   reason.
5. Run the relevant tests and structural checks.
6. Commit the unit with an imperative conventional commit. Push the branch and
   open or update its pull request when the repository has a real remote (see
   Git Hosting below). Do not merge, rewrite recovered history, or commit
   credentials and harness state.

Do not redo completed work. A later invocation reads the commits and checklists
you leave behind and selects the next unresolved unit.

## The Capability Record

`.agents/capabilities.json` holds the read-only probe of every external
capability later items depend on — git hosting, deploy target, environment set,
usage meter, telemetry sink, analytics sink — each with a verdict and the
literal output behind it. Items that rest on one were already resolved against
it when the checklists were instantiated. Use it, and keep it honest:

- **Do not re-litigate a recorded verdict from memory.** If an item says
  `capability:<id> unavailable`, that is a probe result, not an earlier
  invocation's opinion. Equally, do not treat it as permanently settled: if you
  believe a verdict is wrong, or the environment has changed, re-run the
  capability preflight and cite its fresh output — never edit the record's
  verdict by hand.
- **An `unprobed` verdict blocks the items it gates.** Do not mark such an item
  `MET`; resolve the probe first. The checker enforces this, and it is enforcing
  the cheap version of a mistake that otherwise costs a run.
- **A capability you discover to be missing that the record does not mention is
  a finding.** Re-run the preflight so the gap is recorded where the next
  invocation reads it, rather than describing it only in a commit message.

## Container Hygiene

In project-bound Foreman mode this container is not recreated between
invocations — it is one long-lived environment shared by every Pi turn in this
job, potentially dozens of turns over hours. Anything you leave running
outlives your turn and is still there, still holding its port and memory, when
a later invocation starts.

- Before backgrounding a process (a dev server, a smoke-test target), check for
  and kill any process you or an earlier turn left running on that port. Prefer
  a bounded foreground command (start, curl, then kill) over a detached `&` you
  might forget to stop.
- Kill every process you backgrounded before ending your turn. Do not rely on
  the next invocation, or the harness's own timeout, to clean up after you — a
  killed harness turn does not reliably kill its grandchildren.
- Never commit `*.pid` files, server log files, or other run artifacts (add
  them to `.gitignore` instead); a committed one is itself a sign a process was
  left running.

## Repository and CI Contract

Treat the package manifest, package-manager lockfile, and CI workflow as one
contract. If npm is selected and `package-lock.json` is absent, run
`npm install`, commit the generated lockfile, and then use `npm ci`. Reproduce
the meaningful CI commands locally. A documentation step does not excuse a
broken baseline.

## Environment Tools

The deploy/TLS CLIs are already installed and on `PATH` — do not spend turns
rediscovering them with `find`/`which`/`readlink`:

- `leet-deploy` (`leet-deploy edge preflight|apply ...`, `leet-deploy-service`)
- `leet-ssl-cert`
- `leet-dev-guides` (and its sibling scripts: `bootstrap`, `product-scaffold`,
  `codex-commit`, `skill-instantiate`)
- `gh`, the GitHub CLI, already authenticated — see Git Hosting below

Run `<tool> --help` for its exact command surface rather than reading its
source.

If a task needs a package that isn't already available (a library import
inside `/workspace`, or another global CLI), install it — the container's
root filesystem is otherwise read-only, but a writable global npm prefix is
configured, so `npm install -g <package>` works without root and the result
persists for the life of this container (i.e. across every work item in a
project-bound job, not just this turn). Prefer this over working around a
missing dependency.

## Git Hosting

`gh` is installed and already authenticated: the launcher injects `GH_TOKEN`,
and git is configured to authenticate pushes through `gh auth git-credential`.
Both are ready before your first turn.

- Do **not** run `gh auth login`, `gh auth setup-git`, or `gh auth status` as a
  precondition. Auth is environment, not something to establish, and the
  capability record already holds its probed verdict. `gh auth login` is
  interactive and will hang your invocation until the envelope kills it.
- Do not print, log, or commit `$GH_TOKEN`, and never put it in a remote URL —
  the credential helper already supplies it to git.
- Push your branch and open its PR yourself: `git push -u origin <branch>`, then
  `gh pr create --fill` or, better, `--title`/`--body` written to satisfy the
  step-09 checklist items — a summary of what changed, why, how it was tested,
  and a link to the PRD or dev spec it satisfies. `gh pr view --json` and
  `gh run list --branch <branch>` are how you cite PR and CI state as evidence
  rather than asserting it.
- Re-running a turn is normal. `gh pr create` fails when the branch already has
  an open PR; use `gh pr edit` to update the existing one instead of forcing a
  second.
- **Never merge.** Merging is a gated decision that belongs to the operator and
  the service, not to a worker turn.

Using `gh` for your own branch and pull request is not the pattern the git
hosting capability skill warns about — that skill governs a *product* that
manipulates repositories as a feature, where a shared human identity across many
users and orgs is the defect. Here you are one actor delivering one change in
one repository with a credential the environment already established.

If the repository's remote is a `file://` path, there is no host to talk to:
skip `gh` entirely, commit as usual, and resolve the step-09 items against the
capability record rather than inventing a pull request. Check with
`git remote get-url origin` rather than assuming either way.

## Deployment

Deployment is complete only when its checklist items require it and all of the
following are true:

- every deployment credential is already in your environment as a **value**,
  not as a file: `GOOGLE_APPLICATION_CREDENTIALS_JSON` is the service account
  JSON itself, and `LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY` /
  `LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY` are the keys themselves. `leet-deploy`
  accepts all three in that form. Do not write any of them to a file — not to
  `/harness_state`, not to the workspace, not to `/tmp` — and never print,
  log, or commit them
- use `GOOGLE_CLOUD_PROJECT`, `GODADDY_API_KEY`,
  `GODADDY_API_SECRET`, and `LEET_DEPLOY_EDGE_TLS_EMAIL` only through their
  injected environment variables
- the production artifact is built from the committed workspace
- `leet-deploy edge preflight --domain "$VENTURE_SITE_DOMAIN"` passes
- `leet-deploy edge apply --domain "$VENTURE_SITE_DOMAIN" --dir <artifact-dir>`
  succeeds
- TLS is provisioned or verified with the baked `leet-ssl-cert` tooling
- `https://$VENTURE_SITE_DOMAIN` passes a bounded HTTP smoke test
- the exact URL and verification evidence are recorded in the checklist

Never claim a deployment from a written plan. If a required credential is
missing, report `not-ready` with the exact preflight failure; do not substitute
a local or in-memory deployment.

Which environment you are deploying to is a recorded decision, not an inference
from directory names: read it from `.agents/environments.json`. A venture that
declared no staging environment does not acquire one here — its rehearsal
requirement is the production-shaped local one its checklist names.

### The Deploy SSH Key Is Given, Not Made

`leet-deploy` reaches a VM it creates on GCP/AWS over SSH with a keypair the
platform already owns. That keypair is an injected credential like the GCP
service account, not harness state:

- `$LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY` and `$LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY`
  hold the **keys themselves**, not paths to them. They exist before your first
  turn, and every invocation in this job sees the same pair, so the VM an
  earlier turn created is still reachable from this one.
- Let `leet-deploy` read them from the environment: it already falls back to
  `LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY` / `LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY` and
  accepts either a path or the key itself. Do **not** pass
  `--ssh-private-key "$LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY"` — that expands the
  whole PEM into the process's argv, where `ps`, shell tracing, and command
  auditing can read it. For ssh2, pass the variable as `privateKey` — do not
  `readFileSync` it.
- Do not run `ssh-keygen`, do not write a key into `/harness_state`, the
  workspace, `/tmp`, or `~/.ssh`, and do not pass `--ssh-key` /
  `--ssh-private-key` at all. A key you generate is not on the VM's
  `authorized_keys` and is a new credential nobody can rotate.
- Never print, log, commit, or copy the key material.
- `leet-deploy edge preflight` already checks both as `local.ssh_private_key`
  and `local.ssh_public_key`. If either fails — unset or malformed —
  that is a preflight failure in the same class as an absent GCP credential:
  report `not-ready` quoting those lines and naming the exact variable, and do
  not work around it by making your own key.

Never write that a credential, deploy target, or capability is unavailable
without having just run the named preflight command (e.g. `leet-deploy edge
preflight --domain "$VENTURE_SITE_DOMAIN"`) in this same invocation and citing
its exact output as evidence. A conclusion inherited from an earlier
invocation's self-review or status notes does not satisfy that: it may be
wrong, and grepping the repo for deploy config is not a substitute for
checking the environment's injected credentials. Every invocation that reports
a deploy blocker re-runs the preflight itself before repeating the claim.

### Known Deployment Failures

These have each cost a full invocation. Recognize them by their exact message
and take the stated action instead of re-deriving it.

**`Deployment failed after VM creation: Error: Not connected`**

The VM exists and usually already runs the app; the SSH session `leet-deploy`
was polling on dropped (cloud-init restarts sshd while Docker installs) and
that path does not reconnect. This is *not* a credential problem, and re-running
`edge apply` neither fixes it nor cleans up — it creates another VM.

Before doing anything else, find out what actually got deployed:

```bash
node -e "
const { Client } = require('/usr/local/lib/node_modules/@leettools/leet-deploy/node_modules/ssh2');
const c = new Client();
c.on('ready', () => c.exec('docker ps; curl -s http://localhost:3000/health', (e, s) => {
  if (e) { console.log('exec error:', e.message); c.end(); return; }
  let out = ''; s.on('data', (d) => out += d); s.on('close', () => { console.log(out); c.end(); });
}));
c.on('error', (e) => console.log('SSH error:', e.message));
c.connect({ host: '<vm-public-ip>', port: 22, username: 'ubuntu',
  privateKey: process.env.LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY,
  readyTimeout: 15000 });
"
```

If the container is up and healthy, the app is deployed and only the edge stack
(Traefik, DNS, TLS) is missing. Say exactly that, with the VM's IP and the probe
output, and report `not-ready` with that as the blocker. Do not tear the VM down
and start over; the remaining step is an edge-stack apply, not a redeploy.

**`No user exists for uid 501`**

Every OpenSSH *client* invocation (`ssh`, `ssh-keygen`, `scp`) fails this way:
the harness runs under a uid with no `/etc/passwd` entry, and OpenSSH refuses to
start without one. `/etc/passwd` is read-only — do not try to append to it.

The ssh2 library bundled with `leet-deploy` does not use `/etc/passwd` and works
fine, so use the `node -e` form above for any SSH you need to do by hand. Reach
for it immediately rather than spending turns on `ssh -v`, key-format checks, or
`ssh-keygen`; the injected key is valid and the format is fine, and generating a
replacement would only produce a key the VM does not trust.

**`Permission denied on 'locations/<zone>'` or a GCP `resource-error`**

An organization policy restricts which regions this project may use, or the zone
has no capacity. Both are the same action: try one other region, once. Do not
sweep through regions — each attempt that gets past VM creation leaves a VM
running and billable.

Before changing region, list what earlier attempts already created, and tear
down anything orphaned:

```bash
NODE_PATH=/harness_state/.npm-global/lib/node_modules node -e "
const { GoogleAuth } = require('google-auth-library');
new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  }).getClient()
  .then((c) => c.request({ url: 'https://compute.googleapis.com/compute/v1/projects/'
    + process.env.GOOGLE_CLOUD_PROJECT + '/aggregated/instances' }))
  .then((r) => { for (const [scope, data] of Object.entries(r.data.items || {}))
    for (const i of data.instances || [])
      console.log(scope, i.name, i.status, i.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP); })
  .catch((e) => console.log('ERR', e.message));
"
```

`gcloud` is **not** installed and `npm install -g` will not get you a working
one — use the REST call above (`google-auth-library` is already installed
globally; `@google-cloud/compute` is not).

**When to stop**

Deployment gets one recovery attempt per failure mode, not an open-ended search.
If two consecutive `edge apply` runs fail the same way, stop, record the exact
command and error plus the state of any VM you created, and report `not-ready`.
An invocation spent looping on deploy is an invocation the envelope will kill
with nothing committed — the ceiling is a hang detector, and it does not know
the difference between a hang and a retry loop.

## Foreman Result

End every invocation with one fenced JSON object matching
`leet.dev.result/1`. Foreman uses it to decide whether to assign another Pi
turn.

Use `readiness: "not-ready"` while any selected-cycle checklist item remains
`PENDING`, a required test fails, or the public deployment is unverified. Use
`readiness: "ready"` only after the selected cycle's exact command passes:

```bash
npm run check:checklist -- --complete --cycle dev-cycle
# or:
npm run check:checklist -- --complete --cycle full-lifecycle
```

The independent verifier must be a deterministic command or test runner, not
the implementer identity. Evidence references must name existing workspace
files and include their lowercase SHA-256 digests.

```json
{
  "schema": "leet.dev.result/1",
  "prdRevision": 1,
  "readiness": "not-ready",
  "outcome": {
    "summary": "Completed one bounded checklist unit; more work remains.",
    "siteUrl": null,
    "checks": [
      {
        "id": "checklist-structure",
        "command": "npm run check:checklist -- --complete --cycle <selected-cycle>",
        "passed": true
      }
    ]
  },
  "verification": {
    "verifierId": "check-checklist",
    "independentOf": ["pi-implementer"],
    "verdict": "accepted",
    "evidence": [
      {
        "kind": "workspace-artifact",
        "ref": "workspace://docs/lifecycle/plan.md",
        "sha256": "<sha256>"
      }
    ],
    "diagnostics": "Structural checklist validation passed; completion is still pending."
  }
}
```

On the final turn, set `readiness` to `ready`, set `outcome.siteUrl` to the
verified HTTPS URL, and cite completion/deployment evidence. Foreman independently
runs the baked checklist verifier before accepting `ready`; a claim cannot end
the job by itself.
