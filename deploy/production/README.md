# Production Deployment

- **Domain:** `hello-task.pengfeng.leettools.ai`
- **Target:** `leet-deploy` (GCP VM + Traefik reverse proxy + Let's Encrypt
  TLS via `leet-ssl-cert`) — see `.agents/toolchain.json` and
  `.agents/environments.json`.
- **Artifact:** `Dockerfile` (repo root) — multi-stage `node:24-slim`, built
  and pushed by `leet-deploy edge apply`, not built or hosted separately.

## Deploy

```
leet-deploy edge preflight --domain hello-task.pengfeng.leettools.ai
leet-deploy edge apply --domain hello-task.pengfeng.leettools.ai \
  --dockerfile Dockerfile --backend-port 3000 --health-check-path /health
```

Required environment (already injected by the harness, never generated
locally): `GOOGLE_CLOUD_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`,
`GODADDY_API_KEY`, `GODADDY_API_SECRET`, `LEET_DEPLOY_EDGE_TLS_EMAIL`,
`LEET_DEPLOY_EDGE_ZONE`, `LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY`,
`LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY` (per `.agents/environments.json`
`production.required_env`).

## Rollback

There is no separate image registry/tag history — the deploy target is one
VM running one container built directly from the `Dockerfile` at the deployed
commit. To roll back to a previous release:

1. `git checkout <previous-good-commit>` (or `git revert` the bad commit on
   `main` and check that out).
2. Re-run the same `leet-deploy edge apply` command above — it rebuilds the
   image from that commit's `Dockerfile` and redeploys it to the same VM.
3. Verify: `curl -i https://hello-task.pengfeng.leettools.ai/health` returns
   `200 {"status":"ok"}`, and `GET /` still contains "Hello, Venture!".

If only the edge stack (Traefik/DNS/TLS) needs reapplying without a new
image, use `leet-deploy edge reconcile` instead of a full `apply`. To
decommission the environment entirely, `leet-deploy edge teardown` removes
the GCP edge stack, its DNS records, and (optionally) its VM.
