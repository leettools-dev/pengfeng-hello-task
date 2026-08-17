---
name: system-integrating-git-hosting
description: "Give a product programmatic git operations (create repos, commit, open/merge PRs, read files) against a hosting provider's API behind a swappable, testable port — with a deliberate auth-identity choice (service token vs GitHub App), not the human `gh` CLI."
layer: lifecycle
peers:
  - general-managing-configuration
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Integrating Git Hosting

## Overview

Use this skill when a product must perform **git operations programmatically** —
create repositories, commit files, open and merge pull requests, read repo
contents — as a feature, not just as the repo it lives in. Examples: a service
that scaffolds a repo per customer, a bot that opens PRs, a code-generation tool
that ships changes. It gives a product programmatic control over git the same
way the venture's own delivery pipeline has it: every mutation is an auditable
commit, and provenance travels in-band with the change.

This is a *capability*, not a default. Most products never touch git
programmatically and should not carry this dependency. Add it only when
automating git is an actual product requirement.

## What This Skill Does Not Cover

**An agent operating its own delivery repository is a different case.** When a
coding agent pushes its branch and opens a pull request for the work it just
did, it is not building a product feature — it is one actor delivering one
change in one repository, exactly the "local/dev and interactive use" row of the
identity table below. The `gh` CLI is the right tool there: the environment
establishes its credential once, the agent uses it, and no identity question is
open. The anti-patterns in this skill are about a *server* acting for many users
and repos, where a shared human identity, a shared rate limit, and interactive
login are real defects.

Read the rule as: `gh` and a personal token are wrong for a product's
programmatic git feature, and fine for an agent's own delivery of its own
branch. Everything below is about the former.

## Use This Skill When

- The product creates or mutates repos/branches/PRs on a hosting provider on
  behalf of users or on a schedule.
- You are choosing how an autonomous/server process authenticates to GitHub
  (or GitLab/Gitea) — and reaching for `gh` or a personal token.

## The Pattern: a `GitProvider` port + a hosting adapter

Define a narrow **port** the product depends on, and implement it over the
provider's REST API. Keep the provider and the credential out of the domain
logic so it stays swappable and testable.

```ts
interface GitProvider {
  createRepo(name): Promise<{ repoUrl }>;
  commitFile({ repoUrl, branch, path, content, message }): Promise<void>;
  readFile({ repoUrl, ref, path }): Promise<string | null>;
  openPr({ repoUrl, branch, title, body }): Promise<PullRequest>;
  mergePr({ repoUrl, number }): Promise<void>;
  listPrs(repoUrl): Promise<PullRequest[]>;
}
```

- Implement it over the API (GitHub REST: repo create with `auto_init`;
  branch-off via git-data refs; commit via the contents API with the existing
  blob `sha` on update; PRs via the pulls API).
- **Inject the HTTP client (`fetch`)** so every operation is unit-tested against
  a fake that routes on method + path — no network, no live repo.
- Provide an **in-memory adapter** for local runs and the rest of the product's
  tests; run both adapters through one contract test if correctness matters.

## The load-bearing decision: which identity authenticates

This — not the API calls — is the real choice. Do **not** use the `gh` CLI or a
personal access token for an autonomous/multi-tenant service: both act as *a
human*, share one identity and rate limit, and need interactive login.

| Identity | What it is | Use it for |
|----------|------------|------------|
| **GitHub App** (recommended) | A first-class app actor: per-installation, short-lived tokens; scoped permissions; ~15k req/hr; repos/PRs show the app, not a person | Server-to-server automation, especially acting on behalf of many users/orgs |
| **Fine-grained service token** | A token scoped to an org/repos, acting as its owning account | A simple first cut on a single org you control; swap to an App later |
| **`gh` CLI / personal PAT** | Human identity | Local/dev and interactive use, including an agent delivering its own branch in its own repo — **not** autonomous services acting for others |

Make the token source a small `TokenProvider` the adapter calls (`token():
Promise<string>`), with a static-token implementation and a GitHub-App
implementation (sign an App JWT with the private key → exchange for an
installation token → cache until just before expiry). Selecting App vs token is
then a config choice, not a code change.

## Prerequisites

- **GitHub App auth:** an App with least-privilege repository permissions
  (Administration for repo-create, Contents, Pull requests = read/write),
  installed on the target org; app id, installation id, and PEM private key.
- **Token auth:** a fine-grained token with the same permissions on the org.
- Store credentials in the runtime secret store with role-neutral names; never
  commit the App private key. See
  [general-managing-configuration](../general-managing-configuration/SKILL.md).

## Idempotency and Correctness

- **Re-runs happen.** `mergePr` must treat an already-merged PR as success —
  check `merged_at != null` (the REST field), not just a `merged` flag.
- On a contents write, pass the existing blob `sha` when updating; treat a `404`
  as "new file" but **fail fast on any other non-OK** (don't mask a 403/500 as a
  missing file). Validate the `encoding` before base64-decoding file contents.
- Prefer deriving state from the provider (which PRs are merged, which files
  exist) over private bookkeeping — the repo is the source of truth.

## Testing

- Unit-test every operation with an injected `fetch` fake asserting the exact
  request sequence and mapping. Cover: repo create, branch-off + commit (new and
  updated file), PR open/merge (including already-merged), list mapping, and the
  App JWT → installation-token exchange + caching.
- See `testing-typescript-applications` for the injected-transport approach.

## Reference Implementation

The shape this skill describes is a `GitHubGitProvider` behind a `GitProvider`
port, paired with a `TokenProvider` that has a static-token implementation for
local and CI use and a GitHub App implementation for production. Keeping token
acquisition behind its own port is what lets the auth-identity choice change
without touching call sites.

## Anti-Patterns

- **`gh`/PAT for a server.** A human identity doing machine work *on behalf of
  many users or orgs*: shared actor, one rate limit, interactive auth. Use an
  App. (Not to be confused with an agent using `gh` for its own delivery repo,
  which is fine — see "What This Skill Does Not Cover".)
- **Provider SDK bleaking into domain logic.** Keep the API behind the port.
- **Untested against the real API shape.** A fake that only matches your
  assumptions hides schema mismatches; assert the actual request/response shapes.
- **Trusting a `merged` boolean over `merged_at`.** Already-merged PRs then throw.

## Checklist

- [ ] Git operations are behind a `GitProvider` port, provider details in the adapter
- [ ] Auth identity chosen deliberately (App for autonomous/multi-tenant; not `gh`/PAT)
- [ ] Token source is a swappable `TokenProvider`; App tokens cached with expiry
- [ ] `fetch` injected; each operation unit-tested against a fake
- [ ] `mergePr` idempotent via `merged_at`; contents write handles sha/404/encoding
- [ ] Credentials via the secrets plane with role-neutral names; no key in git
